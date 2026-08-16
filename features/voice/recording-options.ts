import {
  AudioQuality,
  IOSOutputFormat,
  type RecordingOptions,
} from 'expo-audio';

import { VOICE_MAX_AUDIO_BYTES } from '@/domain/services/voice.service';

/** 16 kHz mono AAC — small enough for a 15s Edge Function payload. */
export const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 48_000,
  isMeteringEnabled: true,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    maxFileSize: VOICE_MAX_AUDIO_BYTES,
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/mp4',
    bitsPerSecond: 48_000,
  },
};

export const VOICE_RECORDING_MIME = 'audio/mp4';
