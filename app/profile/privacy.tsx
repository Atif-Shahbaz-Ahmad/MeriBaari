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
import { useTranslation } from '@/hooks/use-translation';
import { usePreferencesStore } from '@/store/preferences-store';

export default function PrivacyScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const shareAnalytics = usePreferencesStore((s) => s.shareAnalytics);
  const setPreference = usePreferencesStore((s) => s.setPreference);

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title={t('profile.privacy')}
            subtitle={t('profile.privacySubtitle')}
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <Card style={styles.card}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('profile.privacyPolicyTitle')}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t('profile.privacyPolicyBody')}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(400)} style={styles.padded}>
          <Card style={styles.card}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('profile.privacyBusinessTitle')}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t('profile.privacyBusinessBody')}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.padded}>
          <Card style={styles.rowCard}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {t('profile.privacyAnalyticsTitle')}
                </Text>
                <Text style={[styles.body, { color: theme.textMuted }]}>
                  {t('profile.privacyAnalyticsBody')}
                </Text>
              </View>
              <PreferenceSwitch
                value={shareAnalytics}
                onValueChange={(v) => void setPreference('shareAnalytics', v)}
                label={t('profile.privacyAnalyticsTitle')}
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
