'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';

export function useAppBootstrap() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const handleAuthUrl = useAuthStore((s) => s.handleAuthUrl);
  const isAuthInitialized = useAuthStore((s) => s.isInitialized);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const profileLoadFailed = useAuthStore((s) => s.profileLoadFailed);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const href = window.location.href;
    if (!/[?&#](?:code|access_token|token_hash|error)=/.test(href)) return;
    void handleAuthUrl(href).catch(() => undefined);
  }, [handleAuthUrl]);

  const isReady =
    isAuthInitialized &&
    !isRestoringSession &&
    !(session && isProfileLoading && !profileLoadFailed) &&
    isOnboardingHydrated &&
    isThemeHydrated &&
    isPreferencesHydrated;

  return {
    isReady,
    isAuthenticated: Boolean(session),
    hasCompletedOnboarding,
    role,
    profileLoadFailed,
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
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const profileLoadFailed = useAuthStore((s) => s.profileLoadFailed);
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
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const clearPasswordRecovery = useAuthStore((s) => s.clearPasswordRecovery);
  const passwordRecoveryPending = useAuthStore((s) => s.passwordRecoveryPending);
  const resendSignupEmail = useAuthStore((s) => s.resendSignupEmail);
  const clearPendingVerification = useAuthStore((s) => s.clearPendingVerification);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);
  const removeAvatar = useAuthStore((s) => s.removeAvatar);
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
    profileLoadFailed,
    passwordRecoveryPending,
    error,
    needsEmailVerification,
    pendingVerificationEmail,
    isAuthenticated: Boolean(session),
    isInitialized,
    sendOtp,
    verifyOtp,
    signUpWithEmail,
    signInWithEmail,
    login,
    signup,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    clearPasswordRecovery,
    resendSignupEmail,
    clearPendingVerification,
    refreshSession,
    refreshProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    signInWithDemo,
    setRole,
    switchRole,
    signOut,
    logout,
    clearError,
  };
}
