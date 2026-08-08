import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AuthHref } from '@/features/auth/navigation';
import { useColorScheme, useTheme } from '@/hooks/use-theme';

/**
 * Unauthenticated entry — Login / Create Account only (no guest/demo).
 */
export default function WelcomeScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="lg" showTagline />
        <Text style={[styles.title, { color: theme.text }]}>Welcome to MeriBaari</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Join smart queues and save your time — sign in to continue.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.actions}>
        <Button title="Login" onPress={() => router.push(AuthHref.login)} />
        <Button
          title="Create Account"
          variant="outline"
          onPress={() => router.push(AuthHref.signup)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
    marginTop: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    maxWidth: 340,
  },
  actions: {
    gap: Spacing.md,
  },
});
