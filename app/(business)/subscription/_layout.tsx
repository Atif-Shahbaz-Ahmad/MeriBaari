import { Redirect, Stack } from 'expo-router';

import { AuthHref, getUnauthenticatedHref } from '@/features/auth/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function SubscriptionLayout() {
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) return null;
  if (!session) return <Redirect href={getUnauthenticatedHref()} />;
  if (role !== 'business') return <Redirect href={AuthHref.customerHome} />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="submitted" />
    </Stack>
  );
}
