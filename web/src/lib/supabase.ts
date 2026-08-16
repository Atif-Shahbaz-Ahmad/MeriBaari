import { createBrowserClient } from '@supabase/ssr';

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

// Untyped client so the web @supabase/ssr package can share the parent Database repos.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase(): ReturnType<typeof createBrowserClient> | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === 'undefined') return null;
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

export function requireSupabase(): ReturnType<typeof createBrowserClient> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new AuthError(
      'not_configured',
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
