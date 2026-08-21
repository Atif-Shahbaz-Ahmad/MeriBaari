/**
 * Public Supabase URL + key for the Next.js app.
 * Accepts both the legacy JWT anon key and the newer publishable key, plus
 * the Expo-prefixed names used by the rest of the monorepo.
 */
export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();
  return { url, anonKey };
}

export function isPublicSupabaseConfigured(): boolean {
  const { url, anonKey } = getPublicSupabaseEnv();
  return Boolean(url && anonKey);
}
