import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { ThemeSelector } from '@/components/profile/ThemeSelector';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Spacing } from '@/constants/spacing';
import { useThemeStore, type ThemePreference } from '@/store/theme-store';

export default function ThemeSettingsScreen() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const onChange = (value: ThemePreference) => {
    void setPreference(value);
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Theme"
            subtitle="Choose light, dark, or system"
            onBack={() => router.back()}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <ThemeSelector value={preference} onChange={onChange} />
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
});
