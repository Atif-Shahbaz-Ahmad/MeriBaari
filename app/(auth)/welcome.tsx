import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthHeroLayout } from '@/components/auth/AuthHeroLayout';
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

  return (
    <AuthHeroLayout variant="welcome">
      <View style={styles.copy}>
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="md" showTagline />
        <Text style={[styles.title, { color: theme.text }]}>Welcome to MeriBaari</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Join smart queues and save your time — sign in to continue.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Login" onPress={() => router.push(AuthHref.login)} />
        <Button
          title="Create Account"
          variant="outline"
          onPress={() => router.push(AuthHref.signup)}
        />
      </View>
    </AuthHeroLayout>
  );
}

const styles = StyleSheet.create({
  copy: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    maxWidth: 340,
  },
  actions: {
    gap: Spacing.md,
  },
});
