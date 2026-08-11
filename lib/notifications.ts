/**
 * MeriBaari notification helpers — Expo SDK 54.
 *
 * Push token registration lives in ExpoPushNotificationService.
 * Importing this module registers the foreground notification handler.
 */

import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import {
  MERIBAARI_QUEUE_CHANNEL_ID,
  MERIBAARI_QUEUE_CHANNEL_NAME,
} from '@/constants/notifications';

export {
  MERIBAARI_QUEUE_CHANNEL_ID,
  MERIBAARI_QUEUE_CHANNEL_NAME,
} from '@/constants/notifications';

/**
 * Foreground: prefer in-app notification UI over OS banners
 * so customers do not see duplicate spam while the app is open.
 * Background / killed: OS still presents Expo Push messages normally.
 * Native-only — web does not implement these Notification APIs.
 */
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const inForeground = AppState.currentState === 'active';
      return {
        shouldShowBanner: !inForeground,
        shouldShowList: !inForeground,
        shouldPlaySound: !inForeground,
        shouldSetBadge: true,
      };
    },
  });
}

export async function ensureMeriBaariNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(MERIBAARI_QUEUE_CHANNEL_ID, {
    name: MERIBAARI_QUEUE_CHANNEL_NAME,
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

/** @deprecated Prefer NotificationPermissionService via the DI container. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  if (settings.canAskAgain === false) {
    return false;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}
