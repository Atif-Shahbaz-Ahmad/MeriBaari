/**
 * MeriBaari — voice-speak
 *
 * Authenticated TTS for customer and business assistants.
 * Uses the caller's JWT. Never uses the service role.
 * API keys stay in Edge Function secrets — never in the mobile app.
 *
 * Does NOT call Gemini. Does NOT execute queue actions. Does NOT store audio.
 * Speaks only the assistant's main message (cards stay visual).
 */

import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

import {
  isRetryableCode,
  logEvent,
  type ChatFailureCode,
} from '../_shared/chatbot/errors.ts';
import { detectReplyStyle, type ReplyStyle } from '../_shared/chatbot/reply-style.ts';
import { splitUrduWithEnglish, transliterateRomanUrdu } from './roman-to-urdu.ts';
import { toSpeakableText, VOICE_MAX_RAW_CHARS } from './speakable-text.ts';

const SPEAK_TIMEOUT_MS = 15_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;
const MAX_AUDIO_BYTES = 400_000;
const DEFAULT_AURA_MODEL = 'aura-2-thalia-en';
const DEFAULT_AZURE_VOICE = 'ur-PK-UzmaNeural';

type VoiceSpeakFailureCode = ChatFailureCode | 'tts_unavailable';

type SpeakSuccess = {
  audioBase64: string;
  mimeType: string;
};

const recentHits = new Map<string, number[]>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonError('invalid_data', 'Method not allowed', 405, false);
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    const azureKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureRegion = Deno.env.get('AZURE_SPEECH_REGION')?.trim();
    const azureVoice = Deno.env.get('AZURE_SPEECH_VOICE')?.trim() || DEFAULT_AZURE_VOICE;
    const auraModel = Deno.env.get('DEEPGRAM_TTS_MODEL')?.trim() || DEFAULT_AURA_MODEL;

    logEvent('request_start', { requestId, fn: 'voice-speak' });

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

    const body = (await req.json().catch(() => ({}))) as {
      text?: unknown;
      replyStyle?: unknown;
    };

    const rawText = typeof body.text === 'string' ? body.text : '';
    if (!rawText.trim()) {
      return jsonError('invalid_data', USER_MESSAGE.invalid_data, 400, false);
    }
    if (rawText.length > VOICE_MAX_RAW_CHARS) {
      return jsonError('invalid_data', USER_MESSAGE.invalid_data, 400, false);
    }

    const speakable = toSpeakableText(rawText);
    if (!speakable) {
      logEvent('request_ok', {
        requestId,
        durationMs: Date.now() - startedAt,
        role,
        skipped: true,
        reason: 'empty_speakable',
      });
      return jsonError('tts_unavailable', USER_MESSAGE.tts_unavailable, 422, true);
    }

    const replyStyle = parseReplyStyle(body.replyStyle) ?? detectReplyStyle(speakable);

    let audio: SpeakSuccess | { kind: 'error'; code: VoiceSpeakFailureCode; status: number; retryable: boolean };

    if (replyStyle === 'english') {
      if (!deepgramKey) {
        return jsonError('not_configured', USER_MESSAGE.not_configured, 503, false);
      }
      audio = await speakDeepgram({
        apiKey: deepgramKey,
        model: auraModel,
        text: speakable,
        requestId,
      });
    } else if (replyStyle === 'urdu_script') {
      if (!azureKey || !azureRegion) {
        return jsonError('not_configured', USER_MESSAGE.not_configured, 503, false);
      }
      audio = await speakAzure({
        apiKey: azureKey,
        region: azureRegion,
        voice: azureVoice,
        parts: splitUrduWithEnglish(speakable),
        requestId,
      });
    } else {
      if (!azureKey || !azureRegion) {
        return jsonError('not_configured', USER_MESSAGE.not_configured, 503, false);
      }
      const converted = transliterateRomanUrdu(speakable);
      if (!converted.ok) {
        logEvent('request_ok', {
          requestId,
          durationMs: Date.now() - startedAt,
          role,
          replyStyle,
          skipped: true,
          reason: 'unreliable_transliteration',
        });
        return jsonError('tts_unavailable', USER_MESSAGE.tts_unavailable, 422, true);
      }
      audio = await speakAzure({
        apiKey: azureKey,
        region: azureRegion,
        voice: azureVoice,
        parts: converted.parts,
        requestId,
      });
    }

    if ('kind' in audio && audio.kind === 'error') {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: audio.code,
        status: audio.status,
        role,
        replyStyle,
      });
      return jsonError(audio.code, USER_MESSAGE[audio.code], audio.status, audio.retryable);
    }

    const success = audio as SpeakSuccess;
    logEvent('request_ok', {
      requestId,
      durationMs: Date.now() - startedAt,
      role,
      replyStyle,
      textLength: speakable.length,
      audioBytes: Math.floor((success.audioBase64.length * 3) / 4),
    });

    return json({
      audioBase64: success.audioBase64,
      mimeType: success.mimeType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    logEvent('request_failed', {
      requestId,
      durationMs: Date.now() - startedAt,
      category: /timeout|aborted/i.test(message) ? 'timeout' : 'unknown',
      reason: error instanceof Error ? error.name : 'unknown',
    });
    if (/timeout|aborted/i.test(message)) {
      return jsonError('timeout', USER_MESSAGE.timeout, 408, true);
    }
    return jsonError('unknown', USER_MESSAGE.unknown, 500, true);
  }
});

const USER_MESSAGE: Record<VoiceSpeakFailureCode, string> = {
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'Voice is only available for customer and business accounts.',
  invalid_data: 'I could not speak that reply right now.',
  timeout: 'Voice playback took too long. Please try again.',
  network: 'Something went wrong while connecting. Please try again.',
  not_configured: 'Voice playback is not available yet.',
  rate_limited: 'Voice is temporarily busy. Please try again in a moment.',
  unavailable: 'Voice playback isn\'t available right now.',
  unknown: 'Voice playback isn\'t available right now.',
  tts_unavailable: 'Voice playback isn\'t available right now.',
};

function parseReplyStyle(raw: unknown): ReplyStyle | null {
  if (raw === 'english' || raw === 'urdu_script' || raw === 'roman_urdu') return raw;
  return null;
}

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

async function speakDeepgram(options: {
  apiKey: string;
  model: string;
  text: string;
  requestId: string;
}): Promise<SpeakSuccess | { kind: 'error'; code: VoiceSpeakFailureCode; status: number; retryable: boolean }> {
  const params = new URLSearchParams({
    model: options.model,
    encoding: 'mp3',
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SPEAK_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.deepgram.com/v1/speak?${params.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: options.text }),
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      logEvent('deepgram_tts_auth_failed', { requestId: options.requestId, status: response.status });
      return { kind: 'error', code: 'not_configured', status: 503, retryable: false };
    }
    if (response.status === 429) {
      return { kind: 'error', code: 'rate_limited', status: 429, retryable: false };
    }
    if (response.status === 408) {
      return { kind: 'error', code: 'timeout', status: 408, retryable: true };
    }
    if (!response.ok) {
      return {
        kind: 'error',
        code: response.status >= 500 ? 'unavailable' : 'tts_unavailable',
        status: response.status >= 500 ? 503 : 422,
        retryable: true,
      };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 64 || bytes.byteLength > MAX_AUDIO_BYTES) {
      return { kind: 'error', code: 'tts_unavailable', status: 422, retryable: true };
    }

    return {
      audioBase64: encodeBase64(bytes),
      mimeType: 'audio/mpeg',
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

async function speakAzure(options: {
  apiKey: string;
  region: string;
  voice: string;
  parts: ReturnType<typeof splitUrduWithEnglish>;
  requestId: string;
}): Promise<SpeakSuccess | { kind: 'error'; code: VoiceSpeakFailureCode; status: number; retryable: boolean }> {
  const ssml = toSsml(options.voice, options.parts);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SPEAK_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://${options.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': options.apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
          'User-Agent': 'MeriBaari',
        },
        body: ssml,
        signal: controller.signal,
      },
    );

    if (response.status === 401 || response.status === 403) {
      logEvent('azure_tts_auth_failed', { requestId: options.requestId, status: response.status });
      return { kind: 'error', code: 'not_configured', status: 503, retryable: false };
    }
    if (response.status === 429) {
      return { kind: 'error', code: 'rate_limited', status: 429, retryable: false };
    }
    if (!response.ok) {
      return {
        kind: 'error',
        code: response.status >= 500 ? 'unavailable' : 'tts_unavailable',
        status: response.status >= 500 ? 503 : 422,
        retryable: true,
      };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 64 || bytes.byteLength > MAX_AUDIO_BYTES) {
      return { kind: 'error', code: 'tts_unavailable', status: 422, retryable: true };
    }

    return {
      audioBase64: encodeBase64(bytes),
      mimeType: 'audio/mpeg',
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

function toSsml(voice: string, parts: ReturnType<typeof splitUrduWithEnglish>): string {
  const inner = parts
    .map((part) => {
      const escaped = escapeXml(part.text);
      if (part.kind === 'en') {
        return `<lang xml:lang="en-US">${escaped}</lang>`;
      }
      return escaped;
    })
    .join('');

  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ur-PK">` +
    `<voice name="${escapeXml(voice)}">${inner}</voice>` +
    `</speak>`
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };
}

function json(payload: Record<string, unknown>, status = 200, retryAfterSeconds?: number): Response {
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
  code: VoiceSpeakFailureCode,
  message: string,
  status: number,
  retryable = isRetryableCode(code === 'tts_unavailable' ? 'unavailable' : code),
  retryAfterSeconds?: number,
): Response {
  const resolvedRetryable = code === 'tts_unavailable' ? true : retryable;
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
