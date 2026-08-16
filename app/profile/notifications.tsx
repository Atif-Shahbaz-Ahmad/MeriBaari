import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { SettingsGroup } from '@/components/profile/SettingsGroup';
import { SettingsItem } from '@/components/profile/SettingsItem';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getContainer } from '@/data';
import type { NotificationPermissionStatus } from '@/domain/services/notification-permission.service';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { requireSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { usePreferencesStore } from '@/store/preferences-store';

export default function NotificationPreferencesScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const pushEnabledLocal = usePreferencesStore((s) => s.pushEnabled);
  const setPreference = usePreferencesStore((s) => s.setPreference);

  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [pushPrefEnabled, setPushPrefEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { notificationPermissionService } = getContainer();
    const status = await notificationPermissionService.getPermissionStatus();
    setPermissionStatus(status);

    if (!isSupabaseConfigured || !user?.id) {
      setPushPrefEnabled(status === 'granted' && pushEnabledLocal);
      return;
    }

    try {
      const supabase = requireSupabase();
      const { data } = await supabase.rpc('ensure_notification_preferences', {
        p_user_id: user.id,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setInAppEnabled(row.in_app !== false);
        setPushPrefEnabled(Boolean(row.push) && status === 'granted');
      } else {
        setPushPrefEnabled(status === 'granted');
      }
    } catch {
      setPushPrefEnabled(status === 'granted' && pushEnabledLocal);
    }
  }, [user?.id, pushEnabledLocal]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onToggleInApp = async (value: boolean) => {
    setInAppEnabled(value);
    if (!isSupabaseConfigured || !user?.id) return;
    try {
      const supabase = requireSupabase();
      await supabase.from('notification_preferences').upsert({
        user_id: user.id,
        in_app: value,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[notifications] in_app preference failed', error);
      }
      Alert.alert('Could not update', 'Please try again.');
      setInAppEnabled(!value);
    }
  };

  const onTogglePush = async (value: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const {
        notificationPermissionService,
        pushNotificationService,
      } = getContainer();

      if (value) {
        let status = await notificationPermissionService.getPermissionStatus();
        if (status === 'undetermined') {
          status = await notificationPermissionService.requestPermission();
        }

        if (status !== 'granted') {
          setPermissionStatus(status);
          setPushPrefEnabled(false);
          await setPreference('pushEnabled', false);
          if (status === 'denied') {
            Alert.alert(
              'Push notifications are disabled',
              'Push notifications are disabled in your device settings. Enable them for MeriBaari to receive queue alerts.',
              [
                { text: 'Not now', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    void notificationPermissionService.openSystemSettings();
                  },
                },
              ],
            );
          }
          return;
        }

        if (user?.id) {
          await pushNotificationService.registerForUser(user.id);
        }

        if (isSupabaseConfigured) {
          const supabase = requireSupabase();
          await supabase.rpc('set_notification_preference_push', {
            p_enabled: true,
          });
        }

        setPermissionStatus('granted');
        setPushPrefEnabled(true);
        await setPreference('pushEnabled', true);
        return;
      }

      // Disable push
      await pushNotificationService.deactivateCurrentDevice();
      if (isSupabaseConfigured) {
        const supabase = requireSupabase();
        await supabase.rpc('set_notification_preference_push', {
          p_enabled: false,
        });
      }
      setPushPrefEnabled(false);
      await setPreference('pushEnabled', false);
    } catch (error) {
      if (__DEV__) {
        console.warn('[notifications] push toggle failed', error);
      }
      Alert.alert('Could not update', 'Please try again.');
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  const deniedInSettings = permissionStatus === 'denied';

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Notifications"
            subtitle="Choose how MeriBaari keeps you updated"
            onBack={() => router.back()}
          />
        </Animated.View>

        <View style={styles.padded}>
          <SettingsGroup title="Delivery channels" index={0}>
            <SettingsItem
              label="In-App Notifications"
              description="Shown in the Notification Center while you use the app"
              switchValue={inAppEnabled}
              onSwitchChange={(value) => void onToggleInApp(value)}
              showDivider
            />
            <SettingsItem
              label="Push Notifications"
              description={
                deniedInSettings
                  ? 'Push notifications are disabled in your device settings.'
                  : 'Queue alerts when the app is in the background'
              }
              switchValue={pushPrefEnabled}
              onSwitchChange={(value) => void onTogglePush(value)}
              showDivider={false}
            />
          </SettingsGroup>
        </View>

        {deniedInSettings ? (
          <Animated.View
            entering={FadeInDown.delay(80).duration(350)}
            style={styles.padded}
          >
            <View
              style={[
                styles.hint,
                { backgroundColor: theme.tints.accent.bg, borderColor: theme.tints.accent.border },
              ]}
            >
              <Text style={[styles.hintTitle, { color: theme.tints.accent.fg }]}>
                Enable in device settings
              </Text>
              <Text style={[styles.hintBody, { color: theme.textSecondary }]}>
                Open your device settings for MeriBaari and allow notifications
                to receive “Your turn” and queue alerts.
              </Text>
              <Text
                style={[styles.hintLink, { color: Colors.primary }]}
                onPress={() => {
                  void getContainer().notificationPermissionService.openSystemSettings();
                }}
              >
                Open device settings
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.padded}>
          <Text style={[styles.footnote, { color: theme.textMuted }]}>
            Email and WhatsApp notifications are not available yet.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  hint: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  hintTitle: {
    ...Typography.small,
  },
  hintBody: {
    ...Typography.caption,
    lineHeight: 20,
  },
  hintLink: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  footnote: {
    ...Typography.caption,
    lineHeight: 18,
  },
});
