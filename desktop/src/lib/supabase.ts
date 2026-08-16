import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { AuthError } from '@/domain/errors/auth-error';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

function createDesktopClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage:
        typeof window === 'undefined'
          ? undefined
          : {
              getItem: (key) => window.localStorage.getItem(key),
              setItem: (key, value) => window.localStorage.setItem(key, value),
              removeItem: (key) => window.localStorage.removeItem(key),
            },
    },
  });
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === 'undefined') return null;
  if (!client) {
    client = createDesktopClient();
  }
  return client;
}

export function requireSupabase(): SupabaseClient {
  const supabase = getSupabase();
  if (!supabase) {
    throw new AuthError(
      'not_configured',
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
