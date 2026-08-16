'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { loginSchema } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { Logo } from '@web/components/Logo';
import { Button, Card, Input } from '@web/components/ui';
import { homeForRole } from '@web/lib/cn';

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Logo variant={scheme === 'dark' ? 'dark' : 'light'} />
      <Card className="mt-8 space-y-4">
        <h1 className="text-2xl font-bold">{t('auth.login.title')}</h1>
        <p className="text-sm text-ink-secondary">{t('auth.login.subtitle')}</p>
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isLoading}>
            {t('auth.login.submit') === 'auth.login.submit' ? 'Sign in' : t('auth.login.submit')}
          </Button>
        </form>
        <div className="flex justify-between text-sm">
          <Link className="text-primary" href="/forgot-password">
            Forgot password
          </Link>
          <Link className="text-primary" href="/signup">
            Create account
          </Link>
        </div>
      </Card>
    </main>
  );
}
