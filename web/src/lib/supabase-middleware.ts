import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getPublicSupabaseEnv } from './supabase-env';

export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getPublicSupabaseEnv();

  let response = NextResponse.next({ request });
  if (!url || !anonKey) return { response, user: null, role: null as string | null };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>,
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options as never);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { response, user: null, role: null as string | null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    response,
    user,
    role:
      profile && typeof (profile as { role?: unknown }).role === 'string'
        ? (profile as { role: string }).role
        : null,
  };
}
