/**
 * Public Supabase URL + key for the Next.js app.
 * Accepts both the legacy JWT anon key and the newer publishable key, plus
 * the Expo-prefixed names used by the rest of the monorepo.
 *
 * Property access must stay static (`process.env.NEXT_PUBLIC_…`). Bracket
 * access is not inlined into Edge middleware, so login would succeed in a
 * Server Action and then bounce back to /login on Vercel.
 */
function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export const supabaseCookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  return {
    url: firstNonEmpty(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
    ),
    anonKey: firstNonEmpty(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
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
