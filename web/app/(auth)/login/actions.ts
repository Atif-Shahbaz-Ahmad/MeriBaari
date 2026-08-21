'use server';

import { redirect } from 'next/navigation';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { normalizeRole } from '@/features/auth/roles';
import { loginSchema } from '@/features/auth/schemas';
import { destinationForRole } from '@web/lib/auth-paths';
import { isPublicSupabaseConfigured } from '@web/lib/supabase-env';
import { createSupabaseServerClient } from '@web/lib/supabase-server';

export type AuthFormState = {
  error: string | null;
  needsEmailVerification?: boolean;
};

const VALIDATION_COPY: Record<string, string> = {
  'validation.email': 'Enter a valid email address.',
  'validation.passwordMin': 'Password must be at least 6 characters.',
  'validation.nameRequired': 'Enter your name.',
  'validation.confirmPassword': 'Confirm your password.',
  'validation.passwordMismatch': 'Passwords do not match.',
};

function validationMessage(key: string | undefined): string {
  if (!key) return 'Check the form and try again.';
  return VALIDATION_COPY[key] ?? key;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isPublicSupabaseConfigured()) {
    return { error: 'Authentication is not configured.' };
  }

  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success) {
    return { error: validationMessage(parsed.error.issues[0]?.message) };
  }

  const supabase = await createSupabaseServerClient({ persistCookies: true });
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: getAuthErrorMessage(error) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Signed in, but no session was created. Please try again.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = normalizeRole(
    profile && typeof (profile as { role?: unknown }).role === 'string'
      ? (profile as { role: string }).role
      : null,
  );

  redirect(destinationForRole(role, String(formData.get('next') ?? '')));
}
