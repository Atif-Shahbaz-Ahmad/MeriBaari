import { create } from 'zustand';

import { getAuthErrorMessage, toAuthError } from '@/domain/errors/auth-error';
import type { Profile } from '@/domain/models';
import { normalizeRole } from '@/features/auth/roles';
import { getContainer } from '@/data';
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
  error: string | null;
  needsEmailVerification: boolean;
  pendingVerificationEmail: string | null;

  initialize: () => Promise<void>;
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
  /** Alias for email/password sign-in. */
  login: (email: string, password: string) => Promise<void>;
  /** Alias for email/password sign-up. */
  signup: (
    email: string,
    password: string,
    fullName?: string,
    role?: UserRole | null,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendSignupEmail: (email?: string) => Promise<void>;
  clearPendingVerification: () => void;
  refreshSession: () => Promise<void>;
  /** Re-fetch profiles row and sync role into auth state. */
  refreshProfile: () => Promise<void>;
  signInWithDemo: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  /** DEV — swap Customer ↔ Business by updating profiles.role. */
  switchRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  /** Alias for signOut. */
  logout: () => Promise<void>;
  clearError: () => void;
  /** Handle magic-link / confirm deep links (meribaari://...). */
  handleAuthUrl: (url: string) => Promise<boolean>;
}

function applyAuthenticated(
  session: AuthSession,
  profile: Profile | null,
): Pick<
  AuthState,
  | 'session'
  | 'user'
  | 'profile'
  | 'role'
  | 'error'
  | 'needsEmailVerification'
  | 'pendingVerificationEmail'
> {
  const role = normalizeRole(profile?.role ?? session.user.role);
  const mergedSession: AuthSession = {
    ...session,
    user: {
      ...session.user,
      fullName: profile?.fullName ?? session.user.fullName,
      phone: profile?.phone ?? session.user.phone,
      email: profile?.email ?? session.user.email,
      avatarUrl: profile?.avatarUrl ?? session.user.avatarUrl,
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
> {
  return {
    session: null,
    user: null,
    profile: null,
    role: null,
    error: null,
    needsEmailVerification: false,
    pendingVerificationEmail: null,
  };
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
  error: null,
  needsEmailVerification: false,
  pendingVerificationEmail: null,

  clearError: () => set({ error: null }),
  clearPendingVerification: () =>
    set({ needsEmailVerification: false, pendingVerificationEmail: null }),

  handleAuthUrl: async (url) => {
    // Concurrent deep-link handlers (Linking + /auth/callback) may race.
    if (get().session) return true;

    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const ctx = await getContainer().authService.establishSessionFromUrl(url);
      if (!ctx) {
        if (get().session) return true;
        set({ isLoading: false, isProfileLoading: false });
        return false;
      }
      set(applyAuthenticated(ctx.session, ctx.profile));
      return true;
    } catch (e) {
      if (get().session) return true;
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
      set({ isRestoringSession: true, isProfileLoading: true, error: null });
      const { authService } = getContainer();

      try {
        if (authListenerUnsub) {
          authListenerUnsub();
          authListenerUnsub = null;
        }

        authListenerUnsub = authService.onAuthStateChange((session) => {
          void (async () => {
            if (!session) {
              if (get().session) {
                set(clearAuth());
              }
              return;
            }

            if (
              get().session?.accessToken === session.accessToken &&
              get().profile
            ) {
              return;
            }

            set({ isProfileLoading: true });
            try {
              const ctx = await authService.loadProfileForSession(session);
              set({
                ...applyAuthenticated(ctx.session, ctx.profile),
                isProfileLoading: false,
              });
            } catch {
              set({ isProfileLoading: false });
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
          } catch (profileError) {
            // Keep the session so auto-login still works; role gate will ask again if needed.
            set({
              session: existing,
              user: existing.user,
              profile: null,
              role: normalizeRole(existing.user.role),
              error: getAuthErrorMessage(profileError),
              needsEmailVerification: false,
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
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const ctx = await getContainer().authService.signInWithEmail({
        email,
        password,
      });
      set(applyAuthenticated(ctx.session, ctx.profile));
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
    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const ctx = await getContainer().authService.signInWithGoogle();
      set(applyAuthenticated(ctx.session, ctx.profile));
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
        return;
      }
      const ctx = await getContainer().authService.loadProfileForSession(session);
      set(applyAuthenticated(ctx.session, ctx.profile));
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ ...clearAuth(), error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  refreshProfile: async () => {
    const session = get().session;
    if (!session?.user.id) return;

    set({ isProfileLoading: true, error: null });
    try {
      const { profileService } = getContainer();
      let profile = await profileService.refresh();
      if (!profile) {
        profile = await profileService.ensure(session.user.id, {
          fullName: session.user.fullName,
          email: session.user.email,
          phone: session.user.phone,
          avatarUrl: session.user.avatarUrl,
          role: session.user.role ?? null,
        });
      }
      set(applyAuthenticated(session, profile));
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isProfileLoading: false });
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
      const profile = await getContainer().authService.setRole(userId, role);
      const session = get().session;
      if (!session) return;
      set(applyAuthenticated(session, profile));
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  switchRole: async (role) => {
    const userId = get().user?.id;
    if (!userId) return;

    set({ isLoading: true, isProfileLoading: true, error: null });
    try {
      const profile = await getContainer().authService.setRole(userId, role);
      const session = get().session;
      if (!session) return;
      set(applyAuthenticated(session, profile));
    } catch (e) {
      const message = getAuthErrorMessage(e);
      set({ error: message });
      throw toAuthError(e);
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await getContainer().authService.signOut();
      set(clearAuth());
    } catch (e) {
      set({ ...clearAuth(), error: getAuthErrorMessage(e) });
    } finally {
      set({ isLoading: false, isProfileLoading: false });
    }
  },

  logout: async () => {
    await get().signOut();
  },
}));
