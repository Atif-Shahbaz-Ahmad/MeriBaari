import type { MicrophonePermissionService, MicrophonePermissionStatus } from '@/domain/services/microphone-permission.service';

export class WebMicrophonePermissionService implements MicrophonePermissionService {
  async getPermissionStatus(): Promise<MicrophonePermissionStatus> {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'undetermined';
    }
    try {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      if (result.state === 'granted') return 'granted';
      if (result.state === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return 'undetermined';
    }
  }

  async isPermissionGranted(): Promise<boolean> {
    return (await this.getPermissionStatus()) === 'granted';
  }

  async requestPermission(): Promise<MicrophonePermissionStatus> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'unavailable';
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return 'granted';
    } catch {
      return 'denied';
    }
  }

  async openSystemSettings(): Promise<void> {
    return;
  }
}
