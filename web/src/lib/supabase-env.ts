/**
 * Public Supabase URL + key for the Next.js app.
 * Accepts both the legacy JWT anon key and the newer publishable key, plus
 * the Expo-prefixed names used by the rest of the monorepo.
 *
 * Use `process.env[name]` (bracket access) so Next.js does not compile missing
 * NEXT_PUBLIC_* values to `undefined` at build time.
 */
function readEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  return {
    url: readEnv(['NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL']),
    anonKey: readEnv([
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ]),
  };
}

export function isPublicSupabaseConfigured(): boolean {
  const { url, anonKey } = getPublicSupabaseEnv();
  return Boolean(url && anonKey);
}

export function supabaseAuthConfigError(): string | null {
  if (isPublicSupabaseConfigured()) return null;
  const { url, anonKey } = getPublicSupabaseEnv();
  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return `Authentication is not configured (missing ${missing.join(', ')}). Set them in Vercel → Settings → Environment Variables, then Redeploy.`;
}
