import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getPublicSupabaseEnv } from '@web/lib/supabase-env';

export async function createSupabaseServerClient(options?: {
  persistCookies?: boolean;
}) {
  const { url, anonKey } = getPublicSupabaseEnv();
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
          for (const { name, value, options: cookieOptions } of cookiesToSet) {
            cookieStore.set(name, value, cookieOptions);
          }
        } catch (error) {
          // Server Components cannot set cookies; middleware refreshes the session.
          // Server Actions must persist the session or login will appear to no-op.
          if (options?.persistCookies) throw error;
        }
      },
    },
  });
}

export async function getServerSession() {
  const { url, anonKey } = getPublicSupabaseEnv();
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
