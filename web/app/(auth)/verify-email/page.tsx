'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button, Card } from '@web/components/ui';

export default function VerifyEmailPage() {
  const { pendingVerificationEmail, resendSignupEmail, isLoading } = useAuth();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Card className="space-y-4">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-ink-secondary">
          We sent a confirmation link to {pendingVerificationEmail || 'your email'}.
        </p>
        <Button
          disabled={isLoading}
          onClick={() =>
            void resendSignupEmail(pendingVerificationEmail ?? undefined)
          }
        >
          Resend email
        </Button>
      </Card>
    </main>
  );
}
