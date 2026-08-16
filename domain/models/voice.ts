import type { ReplyStyle } from '@/domain/models/reply-style';

export type VoiceSessionStatus =
  | 'idle'
  | 'permission_denied'
  | 'listening'
  | 'transcribing'
  | 'processing'
  | 'speaking'
  | 'error';

export type VoiceDetectedLanguage = 'en' | 'ur' | 'unknown';

export type VoiceTranscribeInput = {
  audioBase64: string;
  mimeType: string;
  durationMs: number;
};

export type VoiceTranscribeResult = {
  transcript: string;
  detectedLanguage: VoiceDetectedLanguage;
  confidence: number | null;
  replyStyle: ReplyStyle;
};

export type VoiceSpeakInput = {
  text: string;
  replyStyle: ReplyStyle;
};

export type VoiceSpeakResult = {
  audioBase64: string;
  mimeType: string;
};
