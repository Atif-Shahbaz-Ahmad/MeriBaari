import { create } from 'zustand';

import { getAuthErrorMessage, toAuthError } from '@/domain/errors/auth-error';
import type { Profile } from '@/domain/models';
import type { ProfileUpdateInput } from '@/domain/repositories';
import { normalizeRole } from '@/features/auth/roles';
import { profileQueryKeys } from '@/features/profile/query-keys';
import { getContainer } from '@/data';
import { isPasswordRecoveryUrl } from '@/lib/auth-redirect';
import { queryClient } from '@/lib/query-client';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { AuthSession, OtpChannel, UserRole } from '@/types';

type AuthListenerUnsub = (() => void) | null;

interface AuthState {
  session: AuthSession | null;
  user: AuthSession['user'] | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  isRestoringSession: boolean;
  isProfileLoading: boolean;
  /** Session exists but profiles row could not be loaded. */
  profileLoadFailed: boolean;
  /** User opened a password-recovery deep link and must set a new password. */
  passwordRecoveryPending: boolean;
  error: string | null;
  needsEmailVerification: boolean;
  pendingVerificationEmail: string | null;

  initialize: () => Promise<void>;
  /** Alias for initialize. */
  initializeAuth: () => Promise<void>;
  sendOtp: (channel: OtpChannel, destination: string) => Promise<void>;
  verifyOtp: (
    channel: OtpChannel,
    destination: string,
    token: string,
  ) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string,
    role?: UserRole | null,
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName?: string,
    role?: UserRole | null,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearPasswordRecovery: () => void;
  resendSignupEmail: (email?: string) => Promise<void>;
  clearPendingVerification: () => void;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<void>;
  uploadAvatar: (localUri: string) => Promise<void>;
  removeAvatar: () => Promise<void>;
  /** Sync a profile fetched via React Query into auth state. */
  applyProfile: (profile: Profile) => void;
  signInWithDemo: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  handleAuthUrl: (url: string) => Promise<boolean>;
}

function applyAuthenticated(
  session: AuthSession,
  profile: Profile,
): Pick<
  AuthState,
  | 'session'
  | 'user'
  | 'profile'
  | 'role'
  | 'error'
  | 'needsEmailVerification'
  | 'pendingVerificationEmail'
  | 'profileLoadFailed'
> {
  // Database profile is the source of truth for role — never invent from mocks.
  const role = normalizeRole(profile.role);
  const mergedSession: AuthSession = {
    ...session,
    user: {
      ...session.user,
      fullName: profile.fullName ?? session.user.fullName,
      phone: profile.phone ?? session.user.phone,
      email: profile.email ?? session.user.email,
      avatarUrl: profile.avatarUrl,
      role,
    },
  };

  return {
    session: mergedSession,
    user: mergedSession.user,
    profile,
    role,
    error: null,
    needsEmailVerification: false,
    pendingVerificationEmail: null,
    profileLoadFailed: false,
  };
}

function clearAuth(): Pick<
  AuthState,
  | 'session'
  | 'user'
  | 'profile'
  | 'role'
  | 'error'
  | 'needsEmailVerification'
  | 'pendingVerificationEmail'
  | 'profileLoadFailed'
  | 'passwordRecoveryPending'
> {
  return {
    session: null,
    user: null,
    profile: null,
    role: null,
    error: null,
    needsEmailVerification: false,
    pendingVerificationEmail: null,
    profileLoadFailed: false,
    passwordRecoveryPending: false,
  };
}

function invalidateProfileQueries() {
  void queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
}

let authListenerUnsub: AuthListenerUnsub = null;
let initializing: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: false,
  isInitialized: false,
  isRestoringSession: false,
  isProfileLoading: false,
  profileLoadFailed: false,
  passwordRecoveryPending: false,
  error: null,
  needsEmailVerification: false,
  pendingVerificationEmail: null,

  clearError: () => set({ error: null }),
  clearPendingVerification: () =>
    set({ needsEmailVerification: false, pendingVerificationEmail: null }),
  clearPasswordRecovery: () => set({ passwordRecoveryPending: false }),

  applyProfile: (profile) => {
    const session = get().session;
    if (!session) return;
    set(applyAuthenticated(session, profile));
  },

  handleAuthUrl: async (url) => {
    const isRecovery = isPasswordRecoveryUrl(url);

    // Already fully signed in and not in a recovery flow — ignore.
    if (get().session && get().profile && !isRecovery && !get().passwordRecoveryPending) {
      return true;
    }

    set({
      isLoading: true,
      isProfileLoading: true,
      error: null,
      ...(isRecovery ? { passwordRecoveryPending: true } : {}),
    });
    try {
      const ctx = await getContainer().authService.establishSessionFromUrl(url);
      if (!ctx) {
        if (get().session && get().profile) {
          if (isRecovery) set({ passwordRecoveryPending: true });
          return true;
        }
        set({ isLoading: false, isProfileLoading: false });
        return false;
      }
      set({
        ...applyAuthenticated(ctx.session, ctx.profile),
        ...(isRecovery ? { passwordRecoveryPending: true } : {}),
      });
      invalidateProfileQueries();
      return true;
    } catch (e) {
      if (get().session && get().profile) {
        if (isRecovery) set({ passwordRecoveryPending: true });
        return true;
      }
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  initialize: async () => {
    if (initializing) return initializing;

    initializing = (async () => {
      set({
        isRestoringSession: true,
        isProfileLoading: true,
        profileLoadFailed: false,
        error: null,
      });
      const { authService } = getContainer();

      try {
        if (authListenerUnsub) {
          authListenerUnsub();
          authListenerUnsub = null;
        }

        authListenerUnsub = authService.onAuthStateChange((session, event) => {
          void (async () => {
            if (event === 'PASSWORD_RECOVERY') {
              set({ passwordRecoveryPending: true });
            }

            if (!session) {
              try {
                await getContainer().pushNotificationService.deactivateCurrentDevice();
              } catch {
                /* ignore */
              }
              try {
                getContainer().realtimeService.unsubscribeAll();
              } catch {
                /* ignore cleanup errors */
              }
              if (get().session) {
                set(clearAuth());
                invalidateProfileQueries();
              }
              return;
            }

            if (
              get().session?.accessToken === session.accessToken &&
              get().profile &&
              !get().profileLoadFailed &&
              event !== 'PASSWORD_RECOVERY'
            ) {
              return;
            }

            set({ isProfileLoading: true, profileLoadFailed: false });
            try {
              const ctx = await authService.loadProfileForSession(session);
              set({
                ...applyAuthenticated(ctx.session, ctx.profile),
                isProfileLoading: false,
                ...(event === 'PASSWORD_RECOVERY'
                  ? { passwordRecoveryPending: true }
                  : {}),
              });
              invalidateProfileQueries();
            } catch (profileError) {
              set({
                session,
                user: session.user,
                profile: null,
                role: null,
                profileLoadFailed: true,
                isProfileLoading: false,
                error: getAuthErrorMessage(profileError),
                ...(event === 'PASSWORD_RECOVERY'
                  ? { passwordRecoveryPending: true }
                  : {}),
              });
            }
          })();
        });

        const existing = await authService.getSession();
        if (existing) {
          try {
            const ctx = await authService.loadProfileForSession(existing);
            set({
              ...applyAuthenticated(ctx.session, ctx.profile),
              isInitialized: true,
              isRestoringSession: false,
              isProfileLoading: false,
            });
            invalidateProfileQueries();
          } catch (profileError) {
            // Keep session, but do NOT route from metadata/mock role.
            set({
              session: existing,
              user: existing.user,
              profile: null,
              role: null,
              profileLoadFailed: true,
              error: getAuthErrorMessage(profileError),
              needsEmailVerification: false,
              pendingVerificationEmail: null,
              isInitialized: true,
              isRestoringSession: false,
              isProfileLoading: false,
            });
          }
          return;
        }

        set({
          ...clearAuth(),
          isInitialized: true,
          isRestoringSession: false,
          isProfileLoading: false,
        });
      } catch (e) {
        set({
          ...clearAuth(),
          isInitialized: true,
          isRestoringSession: false,
          isProfileLoading: false,
          error: getAuthErrorMessage(e),
        });
      } finally {
        initializing = null;
      }
    })();

    return initializing;
  },

  initializeAuth: async () => {
    await get().initialize();
  },

  sendOtp: async (channel, destination) => {
    set({ isLoading: true, error: null });
    try {
      await getContainer().authService.sendOtp(channel, destination);
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (channel, destination, token) => {
    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const ctx = await getContainer().authService.verifyOtp(
        channel,
        destination,
        token,
      );
      set(applyAuthenticated(ctx.session, ctx.profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  signUpWithEmail: async (email, password, fullName, role) => {
    set({
      isLoading: true,
      isProfileLoading: true,
      error: null,
      needsEmailVerification: false,
      pendingVerificationEmail: null,
      profileLoadFailed: false,
    });
    try {
      const result = await getContainer().authService.signUpWithEmail({
        email,
        password,
        fullName,
        role: role ?? null,
      });
      if (result.needsEmailVerification || !result.context) {
        set({
          needsEmailVerification: true,
          pendingVerificationEmail: email.trim(),
          isLoading: false,
          isProfileLoading: false,
        });
        return;
      }
      set(applyAuthenticated(result.context.session, result.context.profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({
      isLoading: true,
      isProfileLoading: true,
      error: null,
      profileLoadFailed: false,
    });
    try {
      const ctx = await getContainer().authService.signInWithEmail({
        email,
        password,
      });
      set(applyAuthenticated(ctx.session, ctx.profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  login: async (email, password) => {
    await get().signInWithEmail(email, password);
  },

  signup: async (email, password, fullName, role) => {
    await get().signUpWithEmail(email, password, fullName, role);
  },

  signInWithGoogle: async () => {
    set({
      isLoading: true,
      isProfileLoading: true,
      error: null,
      profileLoadFailed: false,
    });
    try {
      const ctx = await getContainer().authService.signInWithGoogle();
      set(applyAuthenticated(ctx.session, ctx.profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await getContainer().authService.resetPassword(email);
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false });
    }
  },

  updatePassword: async (password) => {
    set({ isLoading: true, error: null });
    try {
      await getContainer().authService.updatePassword(password);
      set({ passwordRecoveryPending: false });
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false });
    }
  },

  resendSignupEmail: async (email) => {
    const target = (email ?? get().pendingVerificationEmail ?? '').trim();
    if (!target) {
      const message = 'Enter an email address to resend verification.';
      set({ error: message });
      throw toAuthError(new Error(message));
    }
    set({ isLoading: true, error: null });
    try {
      await getContainer().authService.resendSignupEmail(target);
      set({ pendingVerificationEmail: target, needsEmailVerification: true });
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshSession: async () => {
    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const session = await getContainer().authService.refreshSession();
      if (!session) {
        set(clearAuth());
        invalidateProfileQueries();
        return;
      }
      const ctx = await getContainer().authService.loadProfileForSession(session);
      set(applyAuthenticated(ctx.session, ctx.profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ ...clearAuth(), error: message });
      invalidateProfileQueries();
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  refreshProfile: async () => {
    const session = get().session;
    if (!session?.user.id) return;

    set({ isProfileLoading: true, error: null, profileLoadFailed: false });
    try {
      const { profileService } = getContainer();
      let profile = await profileService.refresh();
      if (!profile) {
        profile = await profileService.ensure(session.user.id, {
          fullName: session.user.fullName,
          email: session.user.email,
          phone: session.user.phone,
          avatarUrl: session.user.avatarUrl,
          role: null,
        });
      }
      set(applyAuthenticated(session, profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({
        error: message,
        profile: null,
        role: null,
        profileLoadFailed: true,
      });
      throw toAuthError(e);
    } finally {
      set({ isProfileLoading: false });
    }
  },

  updateProfile: async (input) => {
    const session = get().session;
    const userId = session?.user.id;
    if (!userId) {
      throw toAuthError(new Error('You must be signed in to update your profile.'));
    }

    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const profile = await getContainer().profileService.updateProfile(
        userId,
        input,
      );
      set(applyAuthenticated(session, profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  uploadAvatar: async (localUri) => {
    const session = get().session;
    const userId = session?.user.id;
    if (!userId) {
      throw toAuthError(new Error('You must be signed in to upload a profile picture.'));
    }

    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const profile = await getContainer().profileService.uploadAvatar(
        userId,
        localUri,
      );
      set(applyAuthenticated(session, profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  removeAvatar: async () => {
    const session = get().session;
    const userId = session?.user.id;
    if (!userId) {
      throw toAuthError(new Error('You must be signed in to remove a profile picture.'));
    }

    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const profile = await getContainer().profileService.removeAvatar(userId);
      set(applyAuthenticated(session, profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  signInWithDemo: async () => {
    if (isSupabaseConfigured) {
      const message =
        'Demo sign-in is disabled while Supabase is configured.';
      set({ error: message });
      throw toAuthError(new Error(message));
    }
    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const ctx = await getContainer().authService.createDemoSession(null);
      set(applyAuthenticated(ctx.session, ctx.profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  setRole: async (role) => {
    const userId = get().user?.id;
    if (!userId) return;

    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const profile = await getContainer().profileService.setRole(userId, role);
      const session = get().session;
      if (!session) return;
      set(applyAuthenticated(session, profile));
      invalidateProfileQueries();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  switchRole: async (role) => {
    await get().setRole(role);
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      try {
        await getContainer().pushNotificationService.deactivateCurrentDevice();
      } catch {
        /* ignore push cleanup errors */
      }
      try {
        getContainer().realtimeService.unsubscribeAll();
      } catch {
        /* ignore cleanup errors */
      }
      await getContainer().authService.signOut();
      set(clearAuth());
    } catch (e) {
      set({ ...clearAuth(), error: getAuthErrorMessage(e) });
    } finally {
      set({ isLoading: false, isProfileLoading: false });
      invalidateProfileQueries();
      queryClient.clear();
    }
  },

  logout: async () => {
    await get().signOut();
  },
}));
