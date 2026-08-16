import { Redirect, Stack } from 'expo-router';

import { AuthHref, getUnauthenticatedHref } from '@/features/auth/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Customer experience shell.
 * Redirects unauthenticated users to welcome and wrong-role users to business home.
 */
export default function CustomerLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const profileLoadFailed = useAuthStore((s) => s.profileLoadFailed);
  const passwordRecoveryPending = useAuthStore((s) => s.passwordRecoveryPending);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);

  if (!isInitialized || isRestoringSession || (session && isProfileLoading && !role && !profileLoadFailed)) {
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

  if (!role) {
    return <Redirect href={AuthHref.roleSelect} />;
  }

  if (role === 'admin') {
    return <Redirect href={AuthHref.adminHome} />;
  }

  if (role !== 'customer') {
    return <Redirect href={AuthHref.businessHome} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="join-queue" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="tickets" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="favorites" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="assistant" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
