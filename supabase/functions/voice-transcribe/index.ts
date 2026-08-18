/**
 * MeriBaari — voice-transcribe
 *
 * Authenticated speech-to-text for customer and business assistants.
 * Uses the caller's JWT. Never uses the service role.
 * DEEPGRAM_API_KEY stays in Edge Function secrets — never in the mobile app.
 *
 * Does NOT call Gemini. Does NOT execute queue actions.
 * The mobile app sends the returned transcript through the existing chatbot.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

import { isRetryableCode, logEvent, type ChatFailureCode } from '../_shared/chatbot/errors.ts';
import { detectReplyStyle } from '../_shared/chatbot/reply-style.ts';
import {
  captureException,
  flushSentry,
  initFunctionSentry,
  maybeHandleSentryTest,
  shouldCaptureFailure,
} from '../_shared/sentry.ts';

const MAX_DURATION_MS = 15_000;
const MIN_DURATION_MS = 400;
const MAX_AUDIO_BYTES = 280_000;
const MAX_TRANSCRIPT_LENGTH = 500;
const DEEPGRAM_TIMEOUT_MS = 12_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;
const DEFAULT_STT_MODEL = 'nova-3';

const KEYTERMS = [
  'MeriBaari',
  'queue',
  'ticket',
  'barber',
  'salon',
  'haircut',
  'clinic',
  'pharmacy',
  'pause',
  'resume',
  'skip',
];

type VoiceFailureCode = ChatFailureCode | 'no_speech';

type DeepgramListenResponse = {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
      }>;
      detected_language?: string;
      language_confidence?: number;
    }>;
  };
  metadata?: Record<string, unknown>;
  err_code?: string;
  err_msg?: string;
  error?: string;
};

const recentHits = new Map<string, number[]>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonError('invalid_data', 'Method not allowed', 405, false);
  }

  initFunctionSentry('voice-transcribe');
  const testResponse = await maybeHandleSentryTest(req, 'voice-transcribe');
  if (testResponse) return testResponse;

  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    const sttModel = Deno.env.get('DEEPGRAM_STT_MODEL')?.trim() || DEFAULT_STT_MODEL;

    logEvent('request_start', { requestId, fn: 'voice-transcribe', model: sttModel });

    if (!supabaseUrl || !anonKey) {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: 'not_configured',
        reason: 'missing_supabase_env',
      });
      return jsonError('not_configured', USER_MESSAGE.not_configured, 500, false);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return jsonError('unauthorized', USER_MESSAGE.unauthorized, 401, false);
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError('unauthorized', USER_MESSAGE.unauthorized, 401, false);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: 'unavailable',
        reason: 'profile_lookup_failed',
      });
      return jsonError('unavailable', USER_MESSAGE.unavailable, 500, true);
    }

    const role = profile?.role;
    if (role !== 'customer' && role !== 'business') {
      return jsonError('forbidden', USER_MESSAGE.forbidden, 403, false);
    }

    if (isRateLimited(user.id)) {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: 'rate_limited',
        role,
      });
      return jsonError('rate_limited', USER_MESSAGE.rate_limited, 429, false, 15);
    }

    if (!deepgramKey) {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: 'not_configured',
        reason: 'missing_deepgram_key',
      });
      captureException(new Error('Deepgram API key is not configured'), {
        functionName: 'voice-transcribe',
        feature: 'voice',
        provider: 'deepgram',
        tags: { category: 'not_configured' },
      });
      return jsonError('not_configured', USER_MESSAGE.not_configured, 503, false);
    }

    const body = (await req.json().catch(() => ({}))) as {
      audioBase64?: unknown;
      mimeType?: unknown;
      durationMs?: unknown;
    };

    const durationMs = Number(body.durationMs);
    if (!Number.isFinite(durationMs) || durationMs < MIN_DURATION_MS) {
      return jsonError('no_speech', USER_MESSAGE.no_speech, 400, true);
    }
    if (durationMs > MAX_DURATION_MS + 1_000) {
      return jsonError('invalid_data', USER_MESSAGE.too_long, 400, false);
    }

    const mimeType = normalizeMime(body.mimeType);
    if (!mimeType) {
      return jsonError('invalid_data', USER_MESSAGE.invalid_data, 400, false);
    }

    const audioBase64 =
      typeof body.audioBase64 === 'string' ? body.audioBase64.replace(/\s/g, '') : '';
    if (!audioBase64) {
      return jsonError('invalid_data', USER_MESSAGE.invalid_data, 400, false);
    }

    let audioBytes: Uint8Array;
    try {
      audioBytes = decodeBase64(audioBase64);
    } catch {
      return jsonError('invalid_data', USER_MESSAGE.invalid_data, 400, false);
    }

    if (audioBytes.byteLength < 64) {
      return jsonError('no_speech', USER_MESSAGE.no_speech, 400, true);
    }
    if (audioBytes.byteLength > MAX_AUDIO_BYTES) {
      return jsonError('invalid_data', USER_MESSAGE.too_long, 400, false);
    }

    const deepgram = await listenDeepgram({
      apiKey: deepgramKey,
      model: sttModel,
      mimeType,
      audio: audioBytes,
      requestId,
    });

    if (deepgram.kind === 'error') {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: deepgram.code,
        status: deepgram.status,
        role,
      });
      if (shouldCaptureFailure(deepgram.code)) {
        captureException(new Error(`Deepgram STT failed (${deepgram.code})`), {
          functionName: 'voice-transcribe',
          feature: 'voice',
          provider: 'deepgram',
          tags: {
            category: deepgram.code,
            status: String(deepgram.status),
          },
          extras: { requestId, retryable: deepgram.retryable },
        });
      }
      return jsonError(
        deepgram.code,
        USER_MESSAGE[deepgram.code],
        deepgram.status,
        deepgram.retryable,
      );
    }

    const transcript = deepgram.transcript.trim().slice(0, MAX_TRANSCRIPT_LENGTH);
    if (!transcript || isNonSpeechTranscript(transcript)) {
      logEvent('request_ok', {
        requestId,
        durationMs: Date.now() - startedAt,
        role,
        noSpeech: true,
        detectedLanguage: deepgram.detectedLanguage,
      });
      return jsonError('no_speech', USER_MESSAGE.no_speech, 400, true);
    }

    const replyStyle = detectReplyStyle(transcript);
    logEvent('request_ok', {
      requestId,
      durationMs: Date.now() - startedAt,
      role,
      replyStyle,
      detectedLanguage: deepgram.detectedLanguage,
      transcriptLength: transcript.length,
    });

    return json({
      transcript,
      detectedLanguage: deepgram.detectedLanguage,
      confidence: deepgram.confidence,
      replyStyle,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    logEvent('request_failed', {
      requestId,
      durationMs: Date.now() - startedAt,
      category: /timeout|aborted/i.test(message) ? 'timeout' : 'unknown',
      reason: error instanceof Error ? error.name : 'unknown',
    });
    captureException(error, {
      functionName: 'voice-transcribe',
      feature: 'voice',
      provider: 'deepgram',
      tags: {
        category: /timeout|aborted/i.test(message) ? 'timeout' : 'unknown',
      },
      extras: { requestId },
    });
    if (/timeout|aborted/i.test(message)) {
      return jsonError('timeout', USER_MESSAGE.timeout, 408, true);
    }
    return jsonError('unknown', USER_MESSAGE.unknown, 500, true);
  } finally {
    await flushSentry();
  }
});

const USER_MESSAGE: Record<VoiceFailureCode, string> & { too_long: string } = {
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'Voice is only available for customer and business accounts.',
  invalid_data: 'I could not use that recording. Please try again.',
  no_speech: 'I did not catch that. Please try speaking again.',
  timeout: 'Transcription took too long. Please try again.',
  network: 'Something went wrong while connecting. Please try again.',
  not_configured: 'Voice is not available yet.',
  rate_limited: 'Voice is temporarily busy. Please try again in a moment.',
  unavailable: 'Voice is temporarily unavailable. Please try again in a moment.',
  unknown: 'Something went wrong. Please try again.',
  too_long: 'Please keep recordings under 15 seconds.',
};

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const next = (recentHits.get(userId) ?? []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
  if (next.length >= RATE_MAX) {
    recentHits.set(userId, next);
    return true;
  }
  next.push(now);
  recentHits.set(userId, next);
  return false;
}

function normalizeMime(raw: unknown): string | null {
  if (raw == null || raw === '') return 'audio/mp4';
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase().split(';')[0];
  const allowed = new Set([
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/3gpp',
  ]);
  return allowed.has(value) ? value : null;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isNonSpeechTranscript(text: string): boolean {
  const letters = text.replace(/[^\p{L}\p{N}]+/gu, '');
  return letters.length < 2;
}

async function listenDeepgram(options: {
  apiKey: string;
  model: string;
  mimeType: string;
  audio: Uint8Array;
  requestId: string;
}): Promise<
  | {
      kind: 'ok';
      transcript: string;
      detectedLanguage: 'en' | 'ur' | 'unknown';
      confidence: number | null;
    }
  | { kind: 'error'; code: VoiceFailureCode; status: number; retryable: boolean }
> {
  const params = new URLSearchParams({
    model: options.model,
    detect_language: 'true',
    smart_format: 'true',
    punctuate: 'true',
  });
  for (const term of KEYTERMS) {
    params.append('keyterm', term);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEEPGRAM_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${options.apiKey}`,
        'Content-Type': options.mimeType,
      },
      body: options.audio,
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      logEvent('deepgram_auth_failed', { requestId: options.requestId, status: response.status });
      return { kind: 'error', code: 'not_configured', status: 503, retryable: false };
    }
    if (response.status === 429) {
      return { kind: 'error', code: 'rate_limited', status: 429, retryable: false };
    }
    if (response.status === 408) {
      return { kind: 'error', code: 'timeout', status: 408, retryable: true };
    }
    if (response.status >= 500) {
      return { kind: 'error', code: 'unavailable', status: 503, retryable: true };
    }
    if (!response.ok) {
      return { kind: 'error', code: 'unavailable', status: 503, retryable: true };
    }

    const json = (await response.json()) as DeepgramListenResponse;
    const channel = json.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const transcript = typeof alternative?.transcript === 'string' ? alternative.transcript : '';
    const confidence =
      typeof alternative?.confidence === 'number' && Number.isFinite(alternative.confidence)
        ? alternative.confidence
        : null;

    return {
      kind: 'ok',
      transcript,
      detectedLanguage: mapDetectedLanguage(channel?.detected_language),
      confidence,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (controller.signal.aborted || /timeout|aborted/i.test(message)) {
      return { kind: 'error', code: 'timeout', status: 408, retryable: true };
    }
    return { kind: 'error', code: 'network', status: 503, retryable: true };
  } finally {
    clearTimeout(timer);
  }
}

function mapDetectedLanguage(raw: string | undefined): 'en' | 'ur' | 'unknown' {
  if (!raw) return 'unknown';
  const value = raw.trim().toLowerCase();
  if (value === 'en' || value.startsWith('en-')) return 'en';
  if (value === 'ur' || value.startsWith('ur-')) return 'ur';
  return 'unknown';
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function json(
  payload: Record<string, unknown>,
  status = 200,
  retryAfterSeconds?: number,
): Response {
  const headers: Record<string, string> = {
    ...(corsHeaders() as Record<string, string>),
    'Content-Type': 'application/json',
  };
  if (retryAfterSeconds != null && retryAfterSeconds > 0) {
    headers['Retry-After'] = String(retryAfterSeconds);
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

function jsonError(
  code: VoiceFailureCode,
  message: string,
  status: number,
  retryable = isRetryableCode(code === 'no_speech' ? 'invalid_data' : code),
  retryAfterSeconds?: number,
): Response {
  const resolvedRetryable = code === 'no_speech' ? true : retryable;
  return json(
    {
      error: message,
      code,
      retryable: resolvedRetryable,
      retryAfterSeconds,
    },
    status,
    retryAfterSeconds,
  );
}
