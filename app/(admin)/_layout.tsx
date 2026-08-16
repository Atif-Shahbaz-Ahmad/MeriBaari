import { Redirect, Stack, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldOff } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AuthHref, getHomeHref, getUnauthenticatedHref } from '@/features/auth/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';

function AccessDenied() {
  const theme = useTheme();
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);

  return (
    <Screen>
      <View style={styles.denied}>
        <View style={[styles.icon, { backgroundColor: theme.tints.error.bg }]}>
          <ShieldOff size={32} color={Colors.error} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {t('admin.denied.title')}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {t('admin.denied.body')}
        </Text>
        <PrimaryButton
          title={t('admin.denied.goHome')}
          onPress={() => router.replace(role ? getHomeHref(role) : AuthHref.welcome)}
        />
      </View>
    </Screen>
  );
}

/**
 * Isolated admin shell. Customers and business owners are denied here —
 * not merely hidden from menus.
 */
export default function AdminLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const profileLoadFailed = useAuthStore((s) => s.profileLoadFailed);
  const passwordRecoveryPending = useAuthStore((s) => s.passwordRecoveryPending);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);

  if (
    !isInitialized ||
    isRestoringSession ||
    (session && isProfileLoading && !role && !profileLoadFailed)
  ) {
    return null;
  }

  if (!session) {
    return <Redirect href={getUnauthenticatedHref()} />;
  }

  if (passwordRecoveryPending) {
    return <Redirect href={AuthHref.resetPassword} />;
  }

  if (profileLoadFailed) {
    return <Redirect href={AuthHref.profileRecovery} />;
  }

  if (role !== 'admin') {
    return <AccessDenied />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="payments/[id]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="businesses/[id]"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  denied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
  },
});
