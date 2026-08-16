export async function requestRecordingPermissionsAsync() {
  return { granted: false, status: 'undetermined' };
}

export async function getRecordingPermissionsAsync() {
  return { granted: false, status: 'undetermined' };
}

export const RecordingPresets = { HIGH_QUALITY: {} };

export class AudioRecorder {
  constructor(..._args: unknown[]) {}
}
