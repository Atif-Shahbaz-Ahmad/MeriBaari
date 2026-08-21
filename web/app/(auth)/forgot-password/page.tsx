'use client';

import { useState, type FormEvent } from 'react';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { emailSchema } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { Button, Card, Input } from '@web/components/ui';
import { Logo } from '@web/components/Logo';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      setError(t('validation.email'));
      return;
    }
    try {
      await resetPassword(parsed.data.email);
      setSent(true);
      setError(null);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo />
      <Card className="mt-8 space-y-4">
        <h1 className="text-2xl font-bold">{t('auth.forgot.title')}</h1>
        <p className="text-sm text-ink-secondary">{t('auth.forgot.subtitle')}</p>
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Input
            label={t('auth.login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {sent ? <p className="text-sm text-secondary-600">Reset email sent.</p> : null}
          <Button className="w-full" type="submit" disabled={isLoading}>
            {t('auth.forgot.cta')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
