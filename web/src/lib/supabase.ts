import { createBrowserClient } from '@supabase/ssr';

import { AuthError } from '@/domain/errors/auth-error';
import { getPublicSupabaseEnv, isPublicSupabaseConfigured } from '@web/lib/supabase-env';

export const isSupabaseConfigured = isPublicSupabaseConfigured();

// Untyped client so the web @supabase/ssr package can share the parent Database repos.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase(): ReturnType<typeof createBrowserClient> | null {
  if (!isPublicSupabaseConfigured()) return null;
  if (typeof window === 'undefined') return null;
  if (!client) {
    const { url, anonKey } = getPublicSupabaseEnv();
    client = createBrowserClient(url, anonKey);
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
