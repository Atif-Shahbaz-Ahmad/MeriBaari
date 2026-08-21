'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';

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

  return (
    <>
      <Logo />
      <h1 className="mt-5 text-3xl font-bold tracking-tight">Welcome back</h1>
      <AuthTabs active="login" />
      <form action={formAction} className="mt-6 space-y-5">
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
          {pending ? 'Signing in…' : t('auth.login.cta')}
        </Button>
      </form>
    </>
  );
}
