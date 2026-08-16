import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

/**
 * Deep-link landing for Supabase Auth (magic link, email confirm, OAuth, reset).
 * UI stays minimal — session is established via AuthRepository.
 */
export default function AuthCallbackScreen() {
  const theme = useTheme();
  const url = Linking.useURL();
  const handleAuthUrl = useAuthStore((s) => s.handleAuthUrl);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const passwordRecoveryPending = useAuthStore((s) => s.passwordRecoveryPending);
  const [attempted, setAttempted] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!url || attempted) return;
    setAttempted(true);
    void handleAuthUrl(url)
      .catch(() => undefined)
      .finally(() => setSettled(true));
  }, [url, attempted, handleAuthUrl]);

  if (session && passwordRecoveryPending) {
    return <Redirect href={AuthHref.resetPassword} />;
  }

  if (session) {
    return <Redirect href={getHomeHref(role)} />;
  }

  if (settled && !session) {
    return <Redirect href={AuthHref.welcome} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        Completing sign-in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    ...Typography.body,
    textAlign: 'center',
  },
});
