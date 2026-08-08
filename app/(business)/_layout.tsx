import { Redirect, Stack } from 'expo-router';

import { AuthHref, getUnauthenticatedHref } from '@/features/auth/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Business experience shell.
 * Redirects unauthenticated users to welcome and wrong-role users to customer home.
 */
export default function BusinessLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);

  if (!isInitialized || isRestoringSession || (session && isProfileLoading && !role)) {
    return null;
  }

  if (!session) {
    return <Redirect href={getUnauthenticatedHref()} />;
  }

  if (!role) {
    return <Redirect href={AuthHref.roleSelect} />;
  }

  if (role !== 'business') {
    return <Redirect href={AuthHref.customerHome} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="queue/[queueId]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="walk-in" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="activity" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
