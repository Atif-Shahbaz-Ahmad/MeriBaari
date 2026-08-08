import { Redirect, Stack, usePathname } from 'expo-router';

import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useAuthStore } from '@/store/auth-store';

const AUTH_ENTRY_PATHS = [
  'welcome',
  'login',
  'signup',
  'verify-email',
  'forgot-password',
  'onboarding',
  'role-select',
];

export default function AuthLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const pathname = usePathname();
  const onRoleSelect = pathname.includes('role-select');

  // Hold redirects until restore / profile settle — prevents welcome↔dashboard flash.
  if (!isInitialized || isRestoringSession || (session && isProfileLoading && !role)) {
    return (
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        {AUTH_ENTRY_PATHS.map((name) => (
          <Stack.Screen key={name} name={name} />
        ))}
      </Stack>
    );
  }

  // Fully authenticated users skip welcome/login/signup.
  if (session && role) {
    return <Redirect href={getHomeHref(role)} />;
  }

  // Session restored without a profile role yet.
  if (session && !role && !onRoleSelect) {
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
      <Stack.Screen name="role-select" options={{ animation: 'fade' }} />
    </Stack>
  );
}
