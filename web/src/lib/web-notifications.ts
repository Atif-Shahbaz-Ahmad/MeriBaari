import type { NotificationPermissionService, NotificationPermissionStatus } from '@/domain/services/notification-permission.service';

export class WebNotificationPermissionService implements NotificationPermissionService {
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (typeof Notification === 'undefined') return 'unavailable';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'undetermined';
  }

  async isPermissionGranted(): Promise<boolean> {
    return (await this.getPermissionStatus()) === 'granted';
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (typeof Notification === 'undefined') return 'unavailable';
    const result = await Notification.requestPermission();
    if (result === 'granted') return 'granted';
    if (result === 'denied') return 'denied';
    return 'undetermined';
  }

  async openSystemSettings(): Promise<void> {
    return;
  }
}
