import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import { notificationQueryKeys } from '@/features/notifications/query-keys';
import { pushDiag, pushDiagError } from '@/features/notifications/push-diagnostics';
import {
  consumePendingPushNavigation,
  navigateFromPushPayload,
  parsePushNotificationData,
  setPendingPushNavigation,
} from '@/features/notifications/push-navigation';
import { queueQueryKeys } from '@/features/queue/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { secureStorage } from '@/lib/secure-store';

const PUSH_PROMPT_KEY = 'meribaari_push_permission_prompted';
const IS_NATIVE_PUSH = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Registers the device push token when the user is authenticated and
 * notification permission is already granted. Does not prompt.
 */
export function usePushTokenRegistration() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);

  useEffect(() => {
    pushDiag('auto_register', 'Effect tick', {
      isInitialized,
      isRestoringSession,
      hasUserId: Boolean(userId),
      userIdPrefix: userId ? `${userId.slice(0, 8)}…` : null,
      platform: Platform.OS,
    });

    if (!IS_NATIVE_PUSH) {
      pushDiag('auto_register', 'Skipped — web has no Expo push token APIs');
      return;
    }

    if (!isInitialized || isRestoringSession || !userId) {
      pushDiag('auto_register', 'Skipped — auth not ready or no user');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { pushNotificationService, notificationPermissionService } =
          getContainer();
        const granted =
          await notificationPermissionService.isPermissionGranted();
        pushDiag('auto_register', 'Permission gate', { granted, cancelled });
        if (!granted || cancelled) {
          pushDiag(
            'auto_register',
            'No register — permission not granted (login path does not prompt)',
          );
          return;
        }
        pushDiag('auto_register', 'Calling registerForUser');
        await pushNotificationService.registerForUser(userId);
      } catch (error) {
        pushDiagError('auto_register', 'auto-register failed', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isInitialized, isRestoringSession]);
}

/**
 * Soft permission prompt after the customer joins a queue (once per install).
 * Never prompts on the welcome/login screens.
 */
export function useRequestPushPermissionAfterJoin() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useCallback(async () => {
    pushDiag('after_join', 'requestAfterJoin start', {
      hasUserId: Boolean(userId),
      userIdPrefix: userId ? `${userId.slice(0, 8)}…` : null,
      platform: Platform.OS,
    });

    if (!IS_NATIVE_PUSH) {
      pushDiag('after_join', 'Skipped — web push not supported');
      return;
    }

    if (!userId) {
      pushDiag('after_join', 'Aborted — no userId');
      return;
    }
    try {
      const already = await secureStorage.getItem(PUSH_PROMPT_KEY);
      pushDiag('after_join', 'Prompt flag', {
        alreadyPrompted: already === '1',
      });

      if (already === '1') {
        const status =
          await getContainer().notificationPermissionService.getPermissionStatus();
        pushDiag('after_join', 'Already prompted — checking live status', {
          status,
        });

        // Stuck state: flag set but OS never resolved (e.g. Android 13 channel timing).
        if (status === 'undetermined') {
          pushDiag(
            'after_join',
            'Stuck undetermined after prior prompt flag — requesting again',
          );
          const next =
            await getContainer().notificationPermissionService.requestPermission();
          pushDiag('after_join', 'Re-prompt result', { next });
          if (next === 'granted') {
            await getContainer().pushNotificationService.registerForUser(
              userId,
            );
          }
          return;
        }

        pushDiag(
          'after_join',
          'Already prompted — register only if permission already granted',
        );
        await getContainer().pushNotificationService.registerForUser(userId);
        return;
      }

      const { notificationPermissionService, pushNotificationService } =
        getContainer();
      const status = await notificationPermissionService.getPermissionStatus();
      pushDiag('after_join', 'Current permission status', { status });

      if (status === 'undetermined') {
        pushDiag('after_join', 'Requesting OS permission (undetermined)');
        const next = await notificationPermissionService.requestPermission();
        await secureStorage.setItem(PUSH_PROMPT_KEY, '1');
        pushDiag('after_join', 'After OS prompt', { next });
        if (next === 'granted') {
          await pushNotificationService.registerForUser(userId);
        } else {
          pushDiag(
            'after_join',
            'Permission not granted after prompt — token will not be saved',
          );
        }
        return;
      }

      await secureStorage.setItem(PUSH_PROMPT_KEY, '1');
      if (status === 'granted') {
        pushDiag('after_join', 'Already granted — registering token');
        await pushNotificationService.registerForUser(userId);
      } else {
        pushDiag(
          'after_join',
          'Not undetermined and not granted — skipping register',
          { status },
        );
      }
    } catch (error) {
      pushDiagError('after_join', 'permission after join failed', error);
    }
  }, [userId]);
}

/**
 * Handles notification taps (foreground, background, cold start) and
 * refreshes relevant React Query caches when returning to the app.
 */
export function usePushNotificationResponses() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const handledResponseIds = useRef(new Set<string>());

  const authReady =
    isInitialized &&
    !isRestoringSession &&
    !(session && isProfileLoading && !role);

  const refreshRelevantQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
  }, [queryClient]);

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && session?.user.id) {
        refreshRelevantQueries();
        void getContainer()
          .pushNotificationService.registerForUser(session.user.id)
          .catch(() => undefined);
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [session?.user.id, refreshRelevantQueries]);

  useEffect(() => {
    // Expo Notifications response APIs are native-only (crash on web).
    if (!IS_NATIVE_PUSH) return;

    const handleResponse = (
      response: Notifications.NotificationResponse | null | undefined,
    ) => {
      if (!response) return;
      const responseId = response.notification.request.identifier;
      if (handledResponseIds.current.has(responseId)) return;
      handledResponseIds.current.add(responseId);

      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const payload = parsePushNotificationData(data);
      if (!payload) return;

      if (!authReady) {
        setPendingPushNavigation(payload);
        return;
      }

      navigateFromPushPayload(payload, {
        isAuthenticated: Boolean(session),
        role,
      });
      refreshRelevantQueries();
    };

    void Notifications.getLastNotificationResponseAsync()
      .then(handleResponse)
      .catch((error) => {
        pushDiagError(
          'bootstrap',
          'getLastNotificationResponseAsync failed',
          error,
        );
      });

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );
    return () => sub.remove();
  }, [authReady, session, role, refreshRelevantQueries]);

  useEffect(() => {
    if (!authReady) return;
    const pending = consumePendingPushNavigation();
    if (!pending) return;
    navigateFromPushPayload(pending, {
      isAuthenticated: Boolean(session),
      role,
    });
    refreshRelevantQueries();
  }, [authReady, session, role, refreshRelevantQueries]);
}

/** Ensure channel exists early on Android (safe no-op elsewhere). */
export function useEnsureNotificationChannel() {
  useEffect(() => {
    pushDiag('bootstrap', 'Ensuring notification channel on app start');
    void getContainer()
      .pushNotificationService.ensureAndroidChannel()
      .then(() => pushDiag('bootstrap', 'Channel bootstrap done'))
      .catch((error) =>
        pushDiagError('bootstrap', 'Channel bootstrap failed', error),
      );
  }, []);
}
