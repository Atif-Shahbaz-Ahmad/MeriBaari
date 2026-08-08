import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { PreferenceSwitch } from '@/components/profile/PreferenceSwitch';
import { Card } from '@/components/ui/Card';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { usePreferencesStore } from '@/store/preferences-store';

export default function PrivacyScreen() {
  const theme = useTheme();
  const shareAnalytics = usePreferencesStore((s) => s.shareAnalytics);
  const setPreference = usePreferencesStore((s) => s.setPreference);

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Privacy"
            subtitle="Control how MeriBaari uses your data"
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <Card style={styles.card}>
            <Text style={[styles.title, { color: theme.text }]}>Privacy Policy (summary)</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              MeriBaari stores your account details and ticket history to help you manage queues.
              We do not sell personal data. Full policy text will ship with the public launch.
              Backend sync with Supabase is planned for a later phase.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.padded}>
          <Card style={styles.rowCard}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: theme.text }]}>Anonymous analytics</Text>
                <Text style={[styles.body, { color: theme.textMuted }]}>
                  Help improve wait-time estimates with aggregated usage data.
                </Text>
              </View>
              <PreferenceSwitch
                value={shareAnalytics}
                onValueChange={(v) => void setPreference('shareAnalytics', v)}
                label="Anonymous analytics"
              />
            </View>
          </Card>
        </Animated.View>
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
  card: {
    gap: Spacing.sm,
  },
  rowCard: {
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.h3,
  },
  body: {
    ...Typography.body,
  },
});
