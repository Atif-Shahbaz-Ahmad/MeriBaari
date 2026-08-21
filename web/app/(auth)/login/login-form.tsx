'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { useTranslation } from '@/hooks/use-translation';
import { AuthTabs } from '@web/components/AuthTabs';
import { Logo } from '@web/components/Logo';
import { UnderlineField, UnderlinePasswordField } from '@web/components/UnderlineField';
import { Button } from '@web/components/ui';

import { loginAction, type AuthFormState } from './actions';

const initialState: AuthFormState = { error: null };

export function LoginForm() {
  const { t } = useTranslation();
  const search = useSearchParams();
  const next = search.get('next') ?? '';
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (!state.redirectTo) return;
    window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <>
      <Logo />
      <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">Welcome back</h1>
      <AuthTabs active="login" />
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="next" value={next} />
        <UnderlineField
          label="Enter your email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <UnderlinePasswordField
          label="Enter Password"
          name="password"
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end">
          <Link className="text-xs font-semibold text-primary" href="/forgot-password">
            Forgot password
          </Link>
        </div>
        {state.error ? (
          <p
            className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <Button className="w-full rounded-lg py-3" type="submit" disabled={pending}>
          {pending || state.redirectTo ? 'Signing in…' : t('auth.login.cta')}
        </Button>
      </form>
    </>
  );
}
