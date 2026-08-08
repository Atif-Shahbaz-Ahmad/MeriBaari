import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { AuthError } from '@/domain/errors/auth-error';
import { secureStorage } from '@/lib/secure-store';
import type { Database } from '@/supabase/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

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
