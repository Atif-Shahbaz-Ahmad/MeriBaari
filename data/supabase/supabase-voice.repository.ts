import { VoiceError, toVoiceError } from '@/domain/errors/voice-error';
import type { ReplyStyle } from '@/domain/models/reply-style';
import type {
  VoiceDetectedLanguage,
  VoiceSpeakInput,
  VoiceSpeakResult,
  VoiceTranscribeInput,
  VoiceTranscribeResult,
} from '@/domain/models/voice';
import type { VoiceRepository } from '@/domain/repositories/voice.repository';
import {
  VOICE_SPEAK_TIMEOUT_MS,
  VOICE_TRANSCRIBE_TIMEOUT_MS,
} from '@/domain/services/voice.service';
import { requireSupabase } from '@/lib/supabase';

type FunctionErrorPayload = {
  error?: string;
  code?: string;
  retryable?: boolean;
};

/**
 * Invokes voice-transcribe / voice-speak with the signed-in user's JWT.
 * Provider keys stay server-side; this client only uses the public anon key + session.
 */
export class SupabaseVoiceRepository implements VoiceRepository {
  async transcribe(input: VoiceTranscribeInput): Promise<VoiceTranscribeResult> {
    const data = await invokeFunction<VoiceTranscribeResult>(
      'voice-transcribe',
      input,
      VOICE_TRANSCRIBE_TIMEOUT_MS,
      'Transcription took too long. Please try again.',
    );
    return parseTranscribeSuccess(data);
  }

  async speak(input: VoiceSpeakInput): Promise<VoiceSpeakResult> {
    try {
      const data = await invokeFunction<VoiceSpeakResult>(
        'voice-speak',
        input,
        VOICE_SPEAK_TIMEOUT_MS,
        'Voice playback took too long. Please try again.',
      );
      return parseSpeakSuccess(data);
    } catch (error) {
      const mapped = toVoiceError(error);
      if (mapped.code === 'timeout') {
        throw new VoiceError(
          'tts_unavailable',
          "Voice playback isn't available right now.",
        );
      }
      if (
        mapped.code === 'unauthorized' ||
        mapped.code === 'forbidden' ||
        mapped.code === 'rate_limited' ||
        mapped.code === 'not_configured' ||
        mapped.code === 'tts_unavailable'
      ) {
        throw mapped;
      }
      throw new VoiceError(
        'tts_unavailable',
        "Voice playback isn't available right now.",
      );
    }
  }
}

async function invokeFunction<T>(
  name: string,
  body: VoiceTranscribeInput | VoiceSpeakInput,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T | FunctionErrorPayload | null> {
  const supabase = requireSupabase();
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const invoke = supabase.functions.invoke<T | FunctionErrorPayload>(name, {
    body,
    signal: controller.signal,
  });

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new VoiceError('timeout', timeoutMessage));
    }, timeoutMs);
  });

  try {
    const { data, error } = await Promise.race([invoke, timeout]);

    if (error) {
      throw functionInvokeError(error, data);
    }

    return data;
  } catch (error) {
    if (timedOut || controller.signal.aborted) {
      throw new VoiceError('timeout', timeoutMessage);
    }
    throw toVoiceError(error);
  } finally {
    if (timer) clearTimeout(timer);
    void invoke.catch(() => undefined);
  }
}

function parseTranscribeSuccess(
  data: VoiceTranscribeResult | FunctionErrorPayload | null,
): VoiceTranscribeResult {
  if (!data || typeof data !== 'object') {
    throw new VoiceError('unknown', 'Something went wrong. Please try again.');
  }

  if ('error' in data && typeof data.error === 'string' && data.error) {
    throw fromPayload(data);
  }

  const result = data as VoiceTranscribeResult;
  const transcript = typeof result.transcript === 'string' ? result.transcript.trim() : '';
  if (!transcript) {
    throw new VoiceError(
      'no_speech',
      'I did not catch that. Please try speaking again.',
    );
  }

  return {
    transcript,
    detectedLanguage: parseDetectedLanguage(result.detectedLanguage),
    confidence:
      typeof result.confidence === 'number' && Number.isFinite(result.confidence)
        ? result.confidence
        : null,
    replyStyle: parseReplyStyle(result.replyStyle),
  };
}

function parseSpeakSuccess(
  data: VoiceSpeakResult | FunctionErrorPayload | null,
): VoiceSpeakResult {
  if (!data || typeof data !== 'object') {
    throw new VoiceError(
      'tts_unavailable',
      "Voice playback isn't available right now.",
    );
  }

  if ('error' in data && typeof data.error === 'string' && data.error) {
    throw fromPayload(data);
  }

  const result = data as VoiceSpeakResult;
  const audioBase64 =
    typeof result.audioBase64 === 'string' ? result.audioBase64.replace(/\s/g, '') : '';
  if (!audioBase64) {
    throw new VoiceError(
      'tts_unavailable',
      "Voice playback isn't available right now.",
    );
  }

  const mimeType =
    typeof result.mimeType === 'string' && result.mimeType.startsWith('audio/')
      ? result.mimeType
      : 'audio/mpeg';

  return { audioBase64, mimeType };
}

function parseDetectedLanguage(raw: unknown): VoiceDetectedLanguage {
  if (raw === 'en' || raw === 'ur') return raw;
  return 'unknown';
}

function parseReplyStyle(raw: unknown): ReplyStyle {
  if (raw === 'urdu_script' || raw === 'roman_urdu' || raw === 'english') return raw;
  return 'english';
}

function functionInvokeError(
  error: unknown,
  data: unknown,
): VoiceError {
  if (data && typeof data === 'object' && 'error' in data && (data as FunctionErrorPayload).error) {
    return fromPayload(data as FunctionErrorPayload, readHttpStatus(error));
  }
  const payload = readNestedPayload(error);
  if (payload) return fromPayload(payload, readHttpStatus(error));

  const status = readHttpStatus(error);
  const mapped = toVoiceError(
    Object.assign(error instanceof Error ? error : new Error(), { status }),
  );
  if (status === 401) return new VoiceError('unauthorized', mapped.message, false);
  if (status === 403) return new VoiceError('forbidden', mapped.message, false);
  if (status === 429) {
    return new VoiceError(
      'rate_limited',
      'Voice is temporarily busy. Please try again in a moment.',
      false,
    );
  }
  return mapped;
}

function fromPayload(payload: FunctionErrorPayload, status?: number): VoiceError {
  const code = payload.code;
  const mapped = toVoiceError({
    payloadCode: code,
    status,
    message: payload.error,
  });
  if (typeof payload.retryable === 'boolean') {
    return new VoiceError(mapped.code, mapped.message, payload.retryable);
  }
  return mapped;
}

function readHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('status' in error) {
    const status = Number((error as { status: unknown }).status);
    if (Number.isFinite(status) && status > 0) return status;
  }
  if ('context' in error) {
    const context = (error as { context?: { status?: unknown } }).context;
    const status = Number(context?.status);
    if (Number.isFinite(status) && status > 0) return status;
  }
  return undefined;
}

function readNestedPayload(error: unknown): FunctionErrorPayload | null {
  if (!error || typeof error !== 'object') return null;
  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== 'object') return null;
  if ('error' in context || 'code' in context) {
    return context as FunctionErrorPayload;
  }
  return null;
}
