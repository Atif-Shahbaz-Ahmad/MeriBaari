'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import { Button, Card } from '@web/components/ui';
import { homeForRole } from '@web/lib/cn';

export default function RoleSelectPage() {
  const { setRole, isLoading } = useAuth();
  const router = useRouter();

  const choose = async (role: 'customer' | 'business') => {
    await setRole(role);
    router.replace(homeForRole(role));
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Card className="space-y-4">
        <h1 className="text-2xl font-bold">Choose how you use MeriBaari</h1>
        <p className="text-sm text-ink-secondary">
          This is stored on your profile. You can only have one role.
        </p>
        <Button disabled={isLoading} onClick={() => void choose('customer')}>
          Customer
        </Button>
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => void choose('business')}
        >
          Business owner
        </Button>
      </Card>
    </main>
  );
}
