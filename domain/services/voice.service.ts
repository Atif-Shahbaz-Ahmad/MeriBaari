import { VoiceError } from '@/domain/errors/voice-error';
import type {
  VoiceSpeakInput,
  VoiceSpeakResult,
  VoiceTranscribeInput,
  VoiceTranscribeResult,
} from '@/domain/models/voice';
import type { VoiceRepository } from '@/domain/repositories/voice.repository';
import { CHATBOT_MAX_INPUT_LENGTH } from '@/domain/services/chatbot.service';

export const VOICE_MIN_DURATION_MS = 400;
export const VOICE_MAX_DURATION_MS = 15_000;
export const VOICE_MAX_AUDIO_BYTES = 280_000;
export const VOICE_MAX_TRANSCRIPT_LENGTH = CHATBOT_MAX_INPUT_LENGTH;
export const VOICE_TRANSCRIBE_TIMEOUT_MS = 20_000;
export const VOICE_SPEAK_TIMEOUT_MS = 20_000;
export const VOICE_COOLDOWN_MS = 1_500;
export const VOICE_MAX_SPEAK_CHARS = 400;
export const VOICE_MAX_RAW_SPEAK_CHARS = 2_000;

const ALLOWED_MIME = new Set([
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/3gpp',
]);

export class VoiceService {
  constructor(private readonly voice: VoiceRepository) {}

  async transcribe(input: VoiceTranscribeInput): Promise<VoiceTranscribeResult> {
    const durationMs = Number(input.durationMs);
    if (!Number.isFinite(durationMs) || durationMs < VOICE_MIN_DURATION_MS) {
      throw new VoiceError(
        'no_speech',
        'I did not catch that. Please try speaking again.',
      );
    }
    if (durationMs > VOICE_MAX_DURATION_MS + 1_000) {
      throw new VoiceError(
        'invalid_data',
        'Please keep recordings under 15 seconds.',
        false,
      );
    }

    const mimeType = normalizeMime(input.mimeType);
    if (!mimeType) {
      throw new VoiceError('invalid_data', 'I could not use that recording. Please try again.');
    }

    const audioBase64 = (input.audioBase64 ?? '').replace(/\s/g, '');
    if (!audioBase64 || !/^[A-Za-z0-9+/]+=*$/.test(audioBase64.slice(0, 80))) {
      throw new VoiceError('invalid_data', 'I could not use that recording. Please try again.');
    }

    const approxBytes = Math.floor((audioBase64.length * 3) / 4);
    if (approxBytes < 64) {
      throw new VoiceError(
        'no_speech',
        'I did not catch that. Please try speaking again.',
      );
    }
    if (approxBytes > VOICE_MAX_AUDIO_BYTES) {
      throw new VoiceError(
        'invalid_data',
        'Please keep recordings under 15 seconds.',
        false,
      );
    }

    const result = await this.voice.transcribe({
      audioBase64,
      mimeType,
      durationMs: Math.round(durationMs),
    });

    const transcript = result.transcript.trim().slice(0, VOICE_MAX_TRANSCRIPT_LENGTH);
    if (!transcript || isNonSpeechTranscript(transcript)) {
      throw new VoiceError(
        'no_speech',
        'I did not catch that. Please try speaking again.',
      );
    }

    return {
      transcript,
      detectedLanguage: result.detectedLanguage,
      confidence: result.confidence,
      replyStyle: result.replyStyle,
    };
  }

  async speak(input: VoiceSpeakInput): Promise<VoiceSpeakResult | null> {
    const replyStyle = input.replyStyle;
    if (replyStyle !== 'english' && replyStyle !== 'urdu_script' && replyStyle !== 'roman_urdu') {
      throw new VoiceError(
        'tts_unavailable',
        "Voice playback isn't available right now.",
      );
    }

    const raw = typeof input.text === 'string' ? input.text : '';
    if (raw.length > VOICE_MAX_RAW_SPEAK_CHARS) {
      throw new VoiceError(
        'tts_unavailable',
        "Voice playback isn't available right now.",
      );
    }

    const text = toSpeakableText(raw);
    if (!text) return null;

    return this.voice.speak({ text, replyStyle });
  }
}

export function toSpeakableText(raw: string, max = VOICE_MAX_SPEAK_CHARS): string {
  let text = (raw ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const compact = text.replace(/\s+/g, '');
  if (
    (compact.startsWith('{') && compact.endsWith('}')) ||
    (compact.startsWith('[') && compact.endsWith(']'))
  ) {
    return '';
  }

  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`[^`]*`/g, ' ');
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/<\/?[^>]+>/g, ' ');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+[.)]\s+/gm, '');
  text = text.replace(/\|/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}

function normalizeMime(raw: string | undefined): string | null {
  if (!raw || typeof raw !== 'string') return 'audio/mp4';
  const value = raw.trim().toLowerCase().split(';')[0];
  return ALLOWED_MIME.has(value) ? value : null;
}

function isNonSpeechTranscript(text: string): boolean {
  const letters = text.replace(/[^A-Za-z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g, '');
  return letters.length < 2;
}
