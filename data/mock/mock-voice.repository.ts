import { VoiceError } from '@/domain/errors/voice-error';
import type {
  VoiceSpeakInput,
  VoiceSpeakResult,
  VoiceTranscribeInput,
  VoiceTranscribeResult,
} from '@/domain/models/voice';
import type { VoiceRepository } from '@/domain/repositories/voice.repository';

/**
 * Used when Supabase is not configured. Does not invent transcripts or speech.
 */
export class MockVoiceRepository implements VoiceRepository {
  async transcribe(_input: VoiceTranscribeInput): Promise<VoiceTranscribeResult> {
    throw new VoiceError('not_configured', 'Voice is not available in this environment.', false);
  }

  async speak(_input: VoiceSpeakInput): Promise<VoiceSpeakResult> {
    throw new VoiceError(
      'not_configured',
      'Voice playback is not available in this environment.',
      false,
    );
  }
}
