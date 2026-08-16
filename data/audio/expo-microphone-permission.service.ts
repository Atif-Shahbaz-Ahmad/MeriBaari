import { Linking, Platform } from 'react-native';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';

import type {
  MicrophonePermissionService,
  MicrophonePermissionStatus,
} from '@/domain/services/microphone-permission.service';

export class ExpoMicrophonePermissionService implements MicrophonePermissionService {
  async getPermissionStatus(): Promise<MicrophonePermissionStatus> {
    try {
      if (Platform.OS === 'web') return 'unavailable';
      const settings = await getRecordingPermissionsAsync();
      return mapStatus(settings.status, settings.granted, settings.canAskAgain);
    } catch {
      return 'unavailable';
    }
  }

  async isPermissionGranted(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status === 'granted';
  }

  async requestPermission(): Promise<MicrophonePermissionStatus> {
    try {
      if (Platform.OS === 'web') return 'unavailable';

      const current = await getRecordingPermissionsAsync();
      const mapped = mapStatus(current.status, current.granted, current.canAskAgain);
      if (mapped === 'granted') return 'granted';
      if (mapped === 'denied' && current.canAskAgain === false) return 'denied';

      const requested = await requestRecordingPermissionsAsync();
      return mapStatus(requested.status, requested.granted, requested.canAskAgain);
    } catch {
      return 'unavailable';
    }
  }

  async openSystemSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch {
      /* ignore */
    }
  }
}

function mapStatus(
  status: string,
  granted: boolean,
  canAskAgain: boolean,
): MicrophonePermissionStatus {
  if (granted || status === 'granted') return 'granted';
  if (status === 'denied' || (canAskAgain === false && !granted)) return 'denied';
  if (status === 'undetermined') return 'undetermined';
  return 'restricted';
}
