import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { LanguageSelector } from '@/components/profile/LanguageSelector';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { usePreferencesStore } from '@/store/preferences-store';
import type { AppLanguage } from '@/types';

export default function LanguageSettingsScreen() {
  const theme = useTheme();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);

  const onChange = (value: AppLanguage) => {
    void setLanguage(value);
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Language"
            subtitle="Display language preference"
            onBack={() => router.back()}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.padded}>
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Full localization arrives later. Your choice is saved on this device.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <LanguageSelector value={language} onChange={onChange} />
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
  note: {
    ...Typography.body,
  },
});
