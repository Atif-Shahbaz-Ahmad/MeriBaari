import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
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
  const [attempted, setAttempted] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!url || attempted) return;
    setAttempted(true);
    void handleAuthUrl(url)
      .catch(() => undefined)
      .finally(() => setSettled(true));
  }, [url, attempted, handleAuthUrl]);

  if (session) {
    return <Redirect href={getHomeHref(role)} />;
  }

  if (settled && !session) {
    return <Redirect href={AuthHref.welcome} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
