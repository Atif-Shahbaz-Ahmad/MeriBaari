'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { LogoutButton } from '@web/components/LogoutButton';

export default function AdminLayout({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isInitialized, isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/admin');
      return;
    }
    if (role && role !== 'admin') {
      router.replace(role === 'business' ? '/business/dashboard' : '/customer/home');
    }
  }, [isAuthenticated, isInitialized, isLoading, role, router]);

  if (!isInitialized || isLoading || (isAuthenticated && !role)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-ink-secondary">…</p>
      </main>
    );
  }

  if (!isAuthenticated || role !== 'admin') {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-ink-secondary">{t('admin.denied.body')}</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="border-b border-line bg-surface-card px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/admin" className="font-semibold">
            {t('admin.dashboard.title')}
          </Link>
          <LogoutButton variant="ghost">{t('common.signOut')}</LogoutButton>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
