'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { isSelectableRole, type SelectableUserRole } from '@/features/auth/roles';
import { signUpSchema } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { AuthTabs } from '@web/components/AuthTabs';
import { Logo } from '@web/components/Logo';
import { UnderlineField, UnderlinePasswordField } from '@web/components/UnderlineField';
import { Button } from '@web/components/ui';
import { homeForRole } from '@web/lib/cn';

export function SignupForm() {
  const { t } = useTranslation();
  const { signup, needsEmailVerification } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<SelectableUserRole>('customer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signUpSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message ?? 'validation.email'));
      return;
    }
    setSubmitting(true);
    try {
      await signup(
        parsed.data.email.trim(),
        parsed.data.password,
        parsed.data.fullName,
        role,
      );
      if (useAuthStore.getState().needsEmailVerification) {
        router.replace('/verify-email');
        router.refresh();
        return;
      }
      router.replace(homeForRole(useAuthStore.getState().role ?? role));
      router.refresh();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Logo />
      <h1 className="mt-5 text-3xl font-bold tracking-tight">Create account</h1>
      <AuthTabs active="signup" />
      <form className="mt-5 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <UnderlineField
          label="Your name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <UnderlineField
          label="Enter your email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <UnderlinePasswordField
          label="Enter Password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <UnderlinePasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-1 w-full text-xs font-medium text-ink-muted">I am a</legend>
          {(['customer', 'business'] as const).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="role"
                checked={role === option}
                onChange={() => {
                  if (isSelectableRole(option)) setRole(option);
                }}
              />
              {option === 'customer' ? 'Customer' : 'Business owner'}
            </label>
          ))}
        </fieldset>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {needsEmailVerification ? (
          <p className="text-sm text-ink-secondary">Check your email to verify your account.</p>
        ) : null}
        <Button className="w-full rounded-lg py-3" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : t('auth.signup.cta')}
        </Button>
      </form>
    </>
  );
}
