import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spacing } from '@/constants/spacing';
import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

/**
 * Shown when a session exists but the profiles row cannot be loaded.
 * Prevents routing to a random/mock dashboard.
 */
export default function ProfileRecoveryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshProfile, logout, isProfileLoading, isLoading, error } = useAuth();

  const onRetry = async () => {
    try {
      await refreshProfile();
      const { profileLoadFailed, role, session } = useAuthStore.getState();
      if (!profileLoadFailed && session) {
        router.replace(getHomeHref(role));
      }
    } catch {
      // error already in store
    }
  };

  const onLogout = async () => {
    if (isLoading) return;
    await logout();
    router.replace(AuthHref.welcome);
  };

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
      <ErrorState
        variant="network"
        title="Couldn’t load your profile"
        description={
          error ??
          'Your session is active, but we couldn’t load your MeriBaari profile. Check your connection and try again.'
        }
        onRetry={() => void onRetry()}
        retryLabel={isProfileLoading ? 'Loading…' : 'Retry'}
      />
      <Button
        title="Log out"
        variant="ghost"
        loading={isLoading}
        disabled={isProfileLoading}
        onPress={() => void onLogout()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    gap: Spacing.md,
  },
});
