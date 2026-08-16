import { Redirect, Stack, usePathname } from 'expo-router';

import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function AuthLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const profileLoadFailed = useAuthStore((s) => s.profileLoadFailed);
  const passwordRecoveryPending = useAuthStore((s) => s.passwordRecoveryPending);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const pathname = usePathname();
  const onRoleSelect = pathname.includes('role-select');
  const onProfileRecovery = pathname.includes('profile-recovery');
  const onResetPassword = pathname.includes('reset-password');

  if (
    !isInitialized ||
    isRestoringSession ||
    (session && isProfileLoading && !role && !profileLoadFailed && !passwordRecoveryPending)
  ) {
    return (
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="profile-recovery" />
      </Stack>
    );
  }

  if (session && passwordRecoveryPending && !onResetPassword) {
    return <Redirect href={AuthHref.resetPassword} />;
  }

  if (session && profileLoadFailed && !onProfileRecovery && !passwordRecoveryPending) {
    return <Redirect href={AuthHref.profileRecovery} />;
  }

  if (session && role && !profileLoadFailed && !passwordRecoveryPending) {
    return <Redirect href={getHomeHref(role)} />;
  }

  if (
    session &&
    !role &&
    !profileLoadFailed &&
    !onRoleSelect &&
    !passwordRecoveryPending
  ) {
    return <Redirect href={AuthHref.roleSelect} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="role-select" options={{ animation: 'fade' }} />
      <Stack.Screen name="profile-recovery" options={{ animation: 'fade' }} />
    </Stack>
  );
}
