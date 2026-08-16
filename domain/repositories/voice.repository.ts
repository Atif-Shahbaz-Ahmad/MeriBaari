import type {
  VoiceSpeakInput,
  VoiceSpeakResult,
  VoiceTranscribeInput,
  VoiceTranscribeResult,
} from '@/domain/models/voice';

export interface VoiceRepository {
  transcribe(input: VoiceTranscribeInput): Promise<VoiceTranscribeResult>;
  speak(input: VoiceSpeakInput): Promise<VoiceSpeakResult>;
}
