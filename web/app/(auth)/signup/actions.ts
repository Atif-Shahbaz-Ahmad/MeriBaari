'use server';

import { redirect } from 'next/navigation';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { isSelectableRole, normalizeRole } from '@/features/auth/roles';
import { signUpSchema } from '@/features/auth/schemas';
import { destinationForRole, webAuthCallbackUrl } from '@web/lib/auth-paths';
import { isPublicSupabaseConfigured } from '@web/lib/supabase-env';
import { createSupabaseServerClient } from '@web/lib/supabase-server';

import type { AuthFormState } from '../login/actions';

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

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isPublicSupabaseConfigured()) {
    return { error: 'Authentication is not configured.' };
  }

  const parsed = signUpSchema.safeParse({
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
  if (!parsed.success) {
    return { error: validationMessage(parsed.error.issues[0]?.message) };
  }

  const roleValue = String(formData.get('role') ?? 'customer');
  const role = isSelectableRole(roleValue) ? roleValue : 'customer';

  const supabase = await createSupabaseServerClient({ persistCookies: true });
  const emailRedirectTo = webAuthCallbackUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
      data: {
        full_name: parsed.data.fullName,
        role,
      },
    },
  });
  if (error) return { error: getAuthErrorMessage(error) };

  if (!data.session) {
    return { error: null, needsEmailVerification: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    : { data: null };

  const profileRole = normalizeRole(
    profile && typeof (profile as { role?: unknown }).role === 'string'
      ? (profile as { role: string }).role
      : role,
  );

  redirect(destinationForRole(profileRole ?? role));
}
