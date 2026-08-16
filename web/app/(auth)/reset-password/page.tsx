'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { Button, Card, Input } from '@web/components/ui';
import { homeForRole } from '@web/lib/cn';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { updatePassword, isLoading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message ?? 'validation.passwordMin'));
      return;
    }
    try {
      await updatePassword(parsed.data.password);
      router.replace(homeForRole(useAuthStore.getState().role));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Card className="space-y-4">
        <h1 className="text-2xl font-bold">{t('auth.reset.title')}</h1>
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Input
            label="New password"
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
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isLoading}>
            {t('auth.reset.cta')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
