import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function env() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return { url, anonKey };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = env();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: object;
        }>,
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot always set cookies; middleware refreshes the session.
        }
      },
    },
  });
}

export async function getServerSession() {
  const { url, anonKey } = env();
  if (!url || !anonKey) return { user: null, role: null as string | null };
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as string | null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role =
    profile && typeof (profile as { role?: unknown }).role === 'string'
      ? (profile as { role: string }).role
      : null;
  return { user, role };
}
