import * as Linking from 'expo-linking';
import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';

export function useAppBootstrap() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const handleAuthUrl = useAuthStore((s) => s.handleAuthUrl);
  const isAuthInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);

  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const isOnboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);

  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const isThemeHydrated = useThemeStore((s) => s.isHydrated);

  const hydratePreferences = usePreferencesStore((s) => s.hydrate);
  const isPreferencesHydrated = usePreferencesStore((s) => s.isHydrated);

  useEffect(() => {
    void Promise.all([
      initializeAuth(),
      hydrateOnboarding(),
      hydrateTheme(),
      hydratePreferences(),
    ]);
  }, [initializeAuth, hydrateOnboarding, hydrateTheme, hydratePreferences]);

  // Magic-link / email-confirm deep links → establish Supabase session in-app
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      void handleAuthUrl(url).catch(() => undefined);
    };

    void Linking.getInitialURL().then(handleUrl);

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [handleAuthUrl]);

  // Hold splash until session + profile role path is settled (avoids login↔home flash).
  const isReady =
    isAuthInitialized &&
    !isRestoringSession &&
    !(session && isProfileLoading) &&
    isOnboardingHydrated &&
    isThemeHydrated &&
    isPreferencesHydrated;

  return {
    isReady,
    isAuthenticated: Boolean(session),
    hasCompletedOnboarding,
    role,
  };
}

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const error = useAuthStore((s) => s.error);
  const needsEmailVerification = useAuthStore((s) => s.needsEmailVerification);
  const pendingVerificationEmail = useAuthStore((s) => s.pendingVerificationEmail);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const resendSignupEmail = useAuthStore((s) => s.resendSignupEmail);
  const clearPendingVerification = useAuthStore((s) => s.clearPendingVerification);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signInWithDemo = useAuthStore((s) => s.signInWithDemo);
  const setRole = useAuthStore((s) => s.setRole);
  const switchRole = useAuthStore((s) => s.switchRole);
  const signOut = useAuthStore((s) => s.signOut);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);

  return {
    session,
    user,
    profile,
    role,
    isLoading,
    isProfileLoading,
    isRestoringSession,
    error,
    needsEmailVerification,
    pendingVerificationEmail,
    isAuthenticated: Boolean(session),
    sendOtp,
    verifyOtp,
    signUpWithEmail,
    signInWithEmail,
    login,
    signup,
    signInWithGoogle,
    resetPassword,
    resendSignupEmail,
    clearPendingVerification,
    refreshSession,
    refreshProfile,
    signInWithDemo,
    setRole,
    switchRole,
    signOut,
    logout,
    clearError,
  };
}
