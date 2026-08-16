'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { signUpSchema } from '@/features/auth/schemas';
import { isSelectableRole, type SelectableUserRole } from '@/features/auth/roles';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { Logo } from '@web/components/Logo';
import { Button, Card, Input } from '@web/components/ui';
import { homeForRole } from '@web/lib/cn';

export default function SignupPage() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const { signup, isLoading, needsEmailVerification } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<SelectableUserRole>('customer');
  const [error, setError] = useState<string | null>(null);

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
    try {
      await signup(
        parsed.data.email.trim(),
        parsed.data.password,
        parsed.data.fullName,
        role,
      );
      if (useAuthStore.getState().needsEmailVerification) {
        router.replace('/verify-email');
        return;
      }
      router.replace(homeForRole(useAuthStore.getState().role ?? role));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Logo variant={scheme === 'dark' ? 'dark' : 'light'} />
      <Card className="mt-8 space-y-4">
        <h1 className="text-2xl font-bold">{t('auth.signup.title')}</h1>
        <p className="text-sm text-ink-secondary">{t('auth.signup.subtitle')}</p>
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Input label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input
            label={t('auth.login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t('auth.login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">I am a</legend>
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
          <Button className="w-full" type="submit" disabled={isLoading}>
            {t('auth.signup.cta')}
          </Button>
        </form>
        <Link className="text-sm text-primary" href="/login">
          {t('auth.signup.loginLink')}
        </Link>
      </Card>
    </main>
  );
}
