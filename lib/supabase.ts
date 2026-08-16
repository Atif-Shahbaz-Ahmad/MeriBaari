import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import { AuthError } from '@/domain/errors/auth-error';
import { secureStorage } from '@/lib/secure-store';
import type { Database } from '@/supabase/types';

function readExtra(key: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.[key];
  return typeof value === 'string' ? value : '';
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || readExtra('supabaseUrl');
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || readExtra('supabaseAnonKey');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function isLocalhostBackendUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * Release APK/IPA must talk to hosted Supabase, never a machine-local stack.
 * Expo Go / `__DEV__` may still use mocks or local Supabase while developing.
 */
export function getReleaseBackendError(): string | null {
  if (__DEV__) {
    return null;
  }
  if (!isSupabaseConfigured) {
    return 'This install is missing the hosted Supabase URL and anon key. Rebuild with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';
  }
  if (isLocalhostBackendUrl(supabaseUrl)) {
    return 'This install points at localhost. Rebuild with the hosted EXPO_PUBLIC_SUPABASE_URL.';
  }
  return null;
}

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!client) {
    client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}

/** Throws a domain AuthError when Supabase is not configured. */
export function requireSupabase(): SupabaseClient<Database> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new AuthError(
      'not_configured',
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
