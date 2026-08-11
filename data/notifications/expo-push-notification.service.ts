import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  MERIBAARI_QUEUE_CHANNEL_ID,
  MERIBAARI_QUEUE_CHANNEL_NAME,
} from '@/constants/notifications';
import type { NotificationPermissionService } from '@/domain/services/notification-permission.service';
import type {
  PushPlatform,
  PushTokenRepository,
} from '@/domain/repositories/push-token.repository';
import type { PushNotificationService } from '@/domain/future';
import { ensureMeriBaariNotificationChannel } from '@/lib/notifications';
import {
  pushDiag,
  pushDiagError,
  redactToken,
} from '@/features/notifications/push-diagnostics';

function resolveProjectId(): string | undefined {
  const fromEasConfig = Constants.easConfig?.projectId;
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId as
    | string
    | undefined;
  const resolved = fromEasConfig ?? fromExtra ?? undefined;

  pushDiag('project_id', 'Resolved Expo projectId sources', {
    platform: Platform.OS,
    fromEasConfig: fromEasConfig ?? null,
    fromExtra: fromExtra ?? null,
    resolved: resolved ?? null,
    isUuidShape: Boolean(
      resolved &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          resolved,
        ),
    ),
    appOwnership: Constants.appOwnership ?? null,
    executionEnvironment: Constants.executionEnvironment ?? null,
  });

  return resolved;
}

function currentPlatform(): PushPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

export class ExpoPushNotificationService implements PushNotificationService {
  private cachedToken: string | null = null;
  private registering: Promise<string | null> | null = null;

  constructor(
    private readonly permissions: NotificationPermissionService,
    private readonly tokens: PushTokenRepository,
  ) {}

  async ensureAndroidChannel(): Promise<void> {
    try {
      pushDiag('channel', 'Ensuring Android notification channel', {
        platform: Platform.OS,
        channelId: MERIBAARI_QUEUE_CHANNEL_ID,
      });
      await ensureMeriBaariNotificationChannel();
      pushDiag('channel', 'Android channel ready (or skipped on non-Android)');
    } catch (error) {
      pushDiagError('channel', 'ensureAndroidChannel failed', error);
      throw error;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      pushDiag('expo_token', 'getExpoPushToken start', {
        platform: Platform.OS,
        isDevice: Device.isDevice,
        deviceName: Device.deviceName ?? null,
        modelName: Device.modelName ?? null,
      });

      if (Platform.OS === 'web') {
        pushDiag('expo_token', 'Skipped — web platform');
        return null;
      }
      if (!Device.isDevice) {
        pushDiag('expo_token', 'Skipped — not a physical device');
        return null;
      }

      await this.ensureAndroidChannel();

      const granted = await this.permissions.isPermissionGranted();
      pushDiag('permission', 'Permission check before token fetch', {
        granted,
      });
      if (!granted) {
        pushDiag('expo_token', 'Aborted — permission not granted');
        return null;
      }

      const projectId = resolveProjectId();
      if (!projectId) {
        pushDiag('expo_token', 'WARNING — no projectId found; calling without options');
      }

      pushDiag('expo_token', 'Calling getExpoPushTokenAsync', {
        hasProjectId: Boolean(projectId),
        projectId: projectId ?? null,
      });

      const tokenResponse = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      const token = tokenResponse?.data ?? null;
      pushDiag('expo_token', 'getExpoPushTokenAsync returned', {
        hasToken: Boolean(token),
        tokenPreview: redactToken(token),
        type: tokenResponse?.type ?? null,
      });

      if (!token) {
        pushDiag('expo_token', 'Token empty/undefined after fetch');
        return null;
      }

      this.cachedToken = token;
      return this.cachedToken;
    } catch (error) {
      pushDiagError('expo_token', 'getExpoPushToken failed', error);
      return null;
    }
  }

  /**
   * Register this device for the authenticated user when permission allows.
   * Safe to call repeatedly — upserts by token and reassigns on account switch.
   */
  async registerForUser(userId: string): Promise<string | null> {
    pushDiag('register_for_user', 'registerForUser called', {
      hasUserId: Boolean(userId),
      userIdPrefix: userId ? `${userId.slice(0, 8)}…` : null,
      alreadyInFlight: Boolean(this.registering),
    });

    if (!userId) {
      pushDiag('register_for_user', 'Aborted — missing userId');
      return null;
    }
    if (this.registering) {
      pushDiag('register_for_user', 'Reusing in-flight registration promise');
      return this.registering;
    }

    this.registering = (async () => {
      try {
        // Android 13+: channel must exist before permission prompt can appear.
        await this.ensureAndroidChannel();

        const granted = await this.permissions.isPermissionGranted();
        pushDiag('register_for_user', 'Permission before register', { granted });
        if (!granted) {
          pushDiag(
            'register_for_user',
            'Aborted — permission not granted (registerForUser does not prompt)',
          );
          return null;
        }

        const token = await this.getExpoPushToken();
        if (!token) {
          pushDiag(
            'register_for_user',
            'Aborted — no Expo push token (see expo_token logs)',
          );
          return null;
        }

        pushDiag('supabase_rpc', 'Calling registerToken repository', {
          platform: currentPlatform(),
          tokenPreview: redactToken(token),
        });

        const rowId = await this.tokens.registerToken({
          token,
          platform: currentPlatform(),
          deviceName: Device.deviceName ?? Device.modelName ?? null,
        });

        pushDiag('supabase_rpc', 'registerToken repository succeeded', {
          hasRowId: Boolean(rowId),
          rowIdPrefix: rowId ? `${String(rowId).slice(0, 8)}…` : null,
        });

        this.cachedToken = token;
        pushDiag('register_for_user', 'Registration complete');
        return token;
      } catch (error) {
        pushDiagError('register_for_user', 'registerForUser failed', error);
        return null;
      } finally {
        this.registering = null;
      }
    })();

    return this.registering;
  }

  /** @deprecated Prefer registerForUser — kept for PushNotificationService interface. */
  async registerDevice(userId: string, token: string): Promise<void> {
    if (!userId || !token) return;
    await this.tokens.registerToken({
      token,
      platform: currentPlatform(),
      deviceName: Device.deviceName ?? Device.modelName ?? null,
    });
    this.cachedToken = token;
  }

  async unregisterDevice(token?: string): Promise<void> {
    const value = token ?? this.cachedToken;
    if (!value) return;
    try {
      await this.tokens.deactivateToken(value);
    } catch (error) {
      pushDiagError('register_for_user', 'unregisterDevice failed', error);
    } finally {
      if (this.cachedToken === value) {
        this.cachedToken = null;
      }
    }
  }

  /** Deactivate the current device token on logout (prevents cross-account leakage). */
  async deactivateCurrentDevice(): Promise<void> {
    try {
      const token =
        this.cachedToken ??
        (await this.getExpoPushToken().catch(() => null));
      if (!token) return;
      await this.unregisterDevice(token);
    } catch {
      /* never block logout */
    }
  }

  async sendLocalNotification(title: string, body: string): Promise<void> {
    try {
      await this.ensureAndroidChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          ...(Platform.OS === 'android'
            ? { channelId: MERIBAARI_QUEUE_CHANNEL_ID }
            : {}),
        },
        trigger: null,
      });
    } catch (error) {
      pushDiagError('register_for_user', 'local notification failed', error);
    }
  }

  getCachedToken(): string | null {
    return this.cachedToken;
  }
}

export { MERIBAARI_QUEUE_CHANNEL_ID, MERIBAARI_QUEUE_CHANNEL_NAME };
