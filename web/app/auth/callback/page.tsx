'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { homeForRole } from '@web/lib/cn';

export default function AuthCallbackPage() {
  const {
    isAuthenticated,
    role,
    isRestoringSession,
    isInitialized,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || isRestoringSession) return;
    if (isAuthenticated) {
      router.replace(homeForRole(role));
      return;
    }
    router.replace('/login');
  }, [isAuthenticated, role, isRestoringSession, isInitialized, router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <p>Completing sign-in…</p>
    </main>
  );
}
