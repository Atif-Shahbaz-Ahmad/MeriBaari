import { create } from 'zustand';

import { StorageKeys } from '@/constants/config';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { secureStorage } from '@/lib/secure-store';
import type { AuthMethod, AuthSession, AuthUser, OtpChannel } from '@/types';

interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  sendOtp: (channel: OtpChannel, destination: string) => Promise<void>;
  verifyOtp: (channel: OtpChannel, destination: string, token: string) => Promise<void>;
  signInWithDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

function createDemoSession(): AuthSession {
  return {
    accessToken: `demo_${Date.now()}`,
    method: 'demo',
    user: {
      id: 'demo-user-1',
      fullName: 'Atif',
      email: 'atif@meribaari.app',
      phone: '+92 300 1234567',
    },
  };
}

async function persistSession(session: AuthSession | null) {
  if (!session) {
    await secureStorage.removeItem(StorageKeys.authSession);
    return;
  }
  await secureStorage.setItem(StorageKeys.authSession, JSON.stringify(session));
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const supabase = getSupabase();

      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const session: AuthSession = {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
            method: data.session.user.phone ? 'phone' : 'email',
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              phone: data.session.user.phone,
              fullName: data.session.user.user_metadata?.full_name ?? null,
              avatarUrl: data.session.user.user_metadata?.avatar_url ?? null,
            },
          };
          set({ session, user: session.user, isInitialized: true });
          return;
        }
      }

      const raw = await secureStorage.getItem(StorageKeys.authSession);
      if (raw) {
        const session = JSON.parse(raw) as AuthSession;
        set({ session, user: session.user, isInitialized: true });
        return;
      }

      set({ session: null, user: null, isInitialized: true });
    } catch {
      set({ session: null, user: null, isInitialized: true });
    }
  },

  sendOtp: async (channel, destination) => {
    set({ isLoading: true });
    try {
      const supabase = getSupabase();
      if (!supabase) {
        // Demo mode: OTP step proceeds without a remote call.
        return;
      }

      if (channel === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({ phone: destination });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email: destination });
        if (error) throw error;
      }
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (channel, destination, token) => {
    set({ isLoading: true });
    try {
      const supabase = getSupabase();

      if (!supabase || !isSupabaseConfigured) {
        const session = createDemoSession();
        if (channel === 'phone') {
          session.user.phone = destination;
          session.method = 'phone';
        } else {
          session.user.email = destination;
          session.method = 'email';
        }
        await persistSession(session);
        set({ session, user: session.user });
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp(
        channel === 'phone'
          ? { phone: destination, token, type: 'sms' }
          : { email: destination, token, type: 'email' },
      );

      if (error) throw error;
      if (!data.session) throw new Error('No session returned');

      const session: AuthSession = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        method: channel,
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
          phone: data.session.user.phone,
          fullName: data.session.user.user_metadata?.full_name ?? null,
          avatarUrl: data.session.user.user_metadata?.avatar_url ?? null,
        },
      };

      await persistSession(session);
      set({ session, user: session.user });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithDemo: async () => {
    set({ isLoading: true });
    try {
      const session = createDemoSession();
      await persistSession(session);
      set({ session, user: session.user });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await persistSession(null);
      set({ session: null, user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
