'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { isSupabaseAuthCookie, nextCookieOptions } from '@web/lib/auth-cookies';
import { isPublicSupabaseConfigured } from '@web/lib/supabase-env';
import { createSupabaseServerClient } from '@web/lib/supabase-server';

export type LogoutState = {
  error: string | null;
  redirectTo: string;
};

async function expireAuthCookies() {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (!isSupabaseAuthCookie(cookie.name)) continue;
    cookieStore.set(
      cookie.name,
      '',
      nextCookieOptions({ path: '/', maxAge: 0, httpOnly: true }),
    );
  }
}

export async function logoutAction(): Promise<LogoutState> {
  try {
    if (isPublicSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient({ persistCookies: true });
      await supabase.auth.signOut();
    }
  } catch {
    // Still expire cookies so the browser cannot keep a dead session.
  }

  await expireAuthCookies();
  revalidatePath('/', 'layout');
  return { error: null, redirectTo: '/login' };
}