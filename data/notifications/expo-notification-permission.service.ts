import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type {
  NotificationPermissionService,
  NotificationPermissionStatus,
} from '@/domain/services/notification-permission.service';
import {
  pushDiag,
  pushDiagError,
} from '@/features/notifications/push-diagnostics';
import { ensureMeriBaariNotificationChannel } from '@/lib/notifications';

function mapStatus(
  settings: Notifications.NotificationPermissionsStatus,
): NotificationPermissionStatus {
  if (Platform.OS === 'web') {
    return 'unavailable';
  }

  if (settings.granted) {
    return 'granted';
  }

  if (
    Platform.OS === 'ios' &&
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }

  if (
    Platform.OS === 'ios' &&
    settings.ios?.status === Notifications.IosAuthorizationStatus.DENIED
  ) {
    return 'denied';
  }

  if (settings.status === 'denied') {
    return 'denied';
  }

  if (settings.canAskAgain === false && !settings.granted) {
    return 'denied';
  }

  if (settings.status === 'undetermined') {
    return 'undetermined';
  }

  return 'restricted';
}

export class ExpoNotificationPermissionService
  implements NotificationPermissionService
{
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      if (Platform.OS === 'web') return 'unavailable';
      const settings = await Notifications.getPermissionsAsync();
      const mapped = mapStatus(settings);
      pushDiag('permission', 'getPermissionStatus', {
        mapped,
        status: settings.status,
        granted: settings.granted,
        canAskAgain: settings.canAskAgain,
        androidImportance: settings.android?.importance ?? null,
      });
      return mapped;
    } catch (error) {
      pushDiagError('permission', 'getPermissionStatus failed', error);
      return 'unavailable';
    }
  }

  async isPermissionGranted(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status === 'granted';
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    try {
      if (Platform.OS === 'web') return 'unavailable';

      // Android 13+: OS permission prompt will not appear until a channel exists.
      if (Platform.OS === 'android') {
        pushDiag(
          'permission',
          'Creating Android channel before requestPermissionsAsync',
        );
        await ensureMeriBaariNotificationChannel();
      }

      const current = await Notifications.getPermissionsAsync();
      const mapped = mapStatus(current);
      pushDiag('permission', 'requestPermission — current status', {
        mapped,
        status: current.status,
        granted: current.granted,
        canAskAgain: current.canAskAgain,
      });

      if (mapped === 'granted') {
        pushDiag('permission', 'Already granted — skipping prompt');
        return 'granted';
      }

      // Do not repeatedly prompt after permanent denial.
      if (mapped === 'denied' && current.canAskAgain === false) {
        pushDiag(
          'permission',
          'Permanently denied (canAskAgain=false) — not prompting again',
        );
        return 'denied';
      }

      pushDiag('permission', 'Calling requestPermissionsAsync (OS prompt)');
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      const next = mapStatus(requested);
      pushDiag('permission', 'requestPermissionsAsync result', {
        mapped: next,
        status: requested.status,
        granted: requested.granted,
        canAskAgain: requested.canAskAgain,
      });
      return next;
    } catch (error) {
      pushDiagError('permission', 'requestPermission failed', error);
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
