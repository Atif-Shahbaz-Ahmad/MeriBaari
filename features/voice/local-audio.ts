import { File, Paths } from 'expo-file-system';

import { VoiceError } from '@/domain/errors/voice-error';

export async function readRecordingAsBase64(uri: string): Promise<{
  audioBase64: string;
  byteLength: number;
}> {
  const file = new File(uri);
  if (!file.exists) {
    throw new VoiceError('invalid_data', 'I could not use that recording. Please try again.');
  }
  const audioBase64 = await file.base64();
  return { audioBase64, byteLength: file.size };
}

export function deleteLocalRecording(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    /* best-effort cleanup — never persist audio */
  }
}

export function writeTempTtsAudio(audioBase64: string, mimeType: string): string {
  const ext = mimeType.includes('wav') ? 'wav' : 'mp3';
  const file = new File(
    Paths.cache,
    `mb-tts-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`,
  );
  if (file.exists) file.delete();
  file.create();
  file.write(audioBase64.replace(/\s/g, ''), { encoding: 'base64' });
  return file.uri;
}
