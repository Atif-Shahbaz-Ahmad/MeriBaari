import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeStore } from '@/store/theme-store';

export function useAppBootstrap() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const isAuthInitialized = useAuthStore((s) => s.isInitialized);
  const session = useAuthStore((s) => s.session);

  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const isOnboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);

  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const isThemeHydrated = useThemeStore((s) => s.isHydrated);

  useEffect(() => {
    void Promise.all([initializeAuth(), hydrateOnboarding(), hydrateTheme()]);
  }, [initializeAuth, hydrateOnboarding, hydrateTheme]);

  const isReady = isAuthInitialized && isOnboardingHydrated && isThemeHydrated;

  return {
    isReady,
    isAuthenticated: Boolean(session),
    hasCompletedOnboarding,
  };
}

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const signInWithDemo = useAuthStore((s) => s.signInWithDemo);
  const signOut = useAuthStore((s) => s.signOut);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: Boolean(session),
    sendOtp,
    verifyOtp,
    signInWithDemo,
    signOut,
  };
}
