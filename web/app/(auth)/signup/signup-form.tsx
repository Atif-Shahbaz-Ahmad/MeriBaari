'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';

import { useTranslation } from '@/hooks/use-translation';
import { AuthTabs } from '@web/components/AuthTabs';
import { Logo } from '@web/components/Logo';
import { UnderlineField, UnderlinePasswordField } from '@web/components/UnderlineField';
import { Button } from '@web/components/ui';

import { signupAction } from './actions';
import type { AuthFormState } from '../login/actions';

const initialState: AuthFormState = { error: null };

export function SignupForm() {
  const { t } = useTranslation();
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  useEffect(() => {
    if (!state.redirectTo) return;
    window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <>
      <Logo />
      <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">Create account</h1>
      <AuthTabs active="signup" />
      <form action={formAction} className="mt-4 space-y-3">
        <UnderlineField
          label="Your name"
          name="fullName"
          autoComplete="name"
          required
        />
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
          autoComplete="new-password"
          required
        />
        <UnderlinePasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
        />
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-1 w-full text-xs font-medium text-ink-muted">I am a</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="customer" defaultChecked />
            Customer
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="business" />
            Business owner
          </label>
        </fieldset>
        {state.error ? (
          <p
            className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        {state.needsEmailVerification ? (
          <p className="text-sm text-ink-secondary">
            Check your email to verify your account, then{' '}
            <Link className="font-semibold text-primary" href="/login">
              sign in
            </Link>
            .
          </p>
        ) : null}
        <Button className="w-full rounded-lg py-3" type="submit" disabled={pending}>
          {pending || state.redirectTo ? 'Creating account…' : t('auth.signup.cta')}
        </Button>
      </form>
    </>
  );
}
