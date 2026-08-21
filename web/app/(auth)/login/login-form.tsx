'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { loginSchema } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { AuthTabs } from '@web/components/AuthTabs';
import { Logo } from '@web/components/Logo';
import { UnderlineField, UnderlinePasswordField } from '@web/components/UnderlineField';
import { Button } from '@web/components/ui';
import { homeForRole } from '@web/lib/cn';

export function LoginForm() {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message ?? 'validation.email'));
      return;
    }
    try {
      await login(parsed.data.email.trim(), parsed.data.password);
      const next = search.get('next');
      const role = useAuthStore.getState().role;
      router.replace(next || homeForRole(role));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <>
      <Logo />
      <h1 className="mt-8 text-3xl font-bold tracking-tight">Welcome back</h1>
      <AuthTabs active="login" />
      <form className="mt-8 space-y-6" onSubmit={(e) => void onSubmit(e)}>
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <Link className="text-xs font-semibold text-primary" href="/forgot-password">
            Forgot password
          </Link>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button className="w-full rounded-lg py-3" type="submit" disabled={isLoading}>
          {t('auth.login.cta')}
        </Button>
      </form>
    </>
  );
}
