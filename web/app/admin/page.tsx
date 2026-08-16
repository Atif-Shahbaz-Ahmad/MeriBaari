'use client';

import Link from 'next/link';

import { formatSubscriptionPrice } from '@/config/payment';
import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { getSubscriptionErrorMessage } from '@/domain/errors/subscription-error';
import {
  useAdminActiveBusinesses,
  useAdminPayments,
  useAdminSubscriptionStats,
} from '@/features/subscription/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import type { OrganizationCategory } from '@/types/organization';
import { Card, EmptyState, ErrorState, LoadingSkeleton } from '@web/components/ui';

export default function AdminPage() {
  const { t } = useTranslation();
  const stats = useAdminSubscriptionStats();
  const payments = useAdminPayments('pending');
  const businesses = useAdminActiveBusinesses();

  if (stats.isLoading || payments.isLoading) return <LoadingSkeleton count={4} />;
  if (stats.isError) {
    return (
      <ErrorState
        title={t('admin.dashboard.loadError')}
        description={getSubscriptionErrorMessage(stats.error)}
        onRetry={() => void stats.refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-ink-muted">
          {t('admin.dashboard.kicker')}
        </p>
        <h1 className="text-3xl font-bold">{t('admin.dashboard.title')}</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-ink-muted">{t('admin.dashboard.pending')}</p>
          <p className="text-2xl font-bold">{stats.data?.pendingPayments ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">{t('admin.dashboard.active')}</p>
          <p className="text-2xl font-bold">{stats.data?.activeBusinesses ?? 0}</p>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('admin.dashboard.requestsTitle')}</h2>
        <p className="text-sm text-ink-secondary">{t('admin.dashboard.requestsSubtitle')}</p>
        {(payments.data ?? []).length === 0 ? (
          <EmptyState
            title={t('admin.dashboard.emptyTitle')}
            description={t('admin.dashboard.emptyBody')}
          />
        ) : (
          (payments.data ?? []).map((payment) => (
            <Card key={payment.id}>
              <p className="font-semibold">
                {payment.organizationName ?? t('admin.dashboard.unknownBusiness')}
              </p>
              <p className="text-sm text-ink-secondary">
                {payment.ownerName ?? t('admin.dashboard.unknownOwner')} ·{' '}
                {formatSubscriptionPrice(payment.amount)}
              </p>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('admin.dashboard.businessesTitle')}</h2>
        <p className="text-sm text-ink-secondary">
          {t('admin.dashboard.businessesSubtitle')}
        </p>
        {businesses.isError ? (
          <ErrorState
            title={t('admin.dashboard.loadError')}
            description={getSubscriptionErrorMessage(businesses.error)}
            onRetry={() => void businesses.refetch()}
          />
        ) : (businesses.data ?? []).length === 0 ? (
          <EmptyState
            title={t('admin.dashboard.businessesEmptyTitle')}
            description={t('admin.dashboard.businessesEmptyBody')}
          />
        ) : (
          (businesses.data ?? []).map((business) => (
            <Link key={business.id} href={`/admin/businesses/${business.id}`}>
              <Card className="hover:border-primary">
                <p className="font-semibold">{business.name}</p>
                <p className="text-sm text-ink-secondary">
                  {getOrganizationCategoryLabel(business.category as OrganizationCategory)}
                  {business.city ? ` · ${business.city}` : ''}
                </p>
                <p className="text-sm text-ink-muted">
                  {business.ownerName ?? t('admin.dashboard.unknownOwner')}
                  {business.adminHidden ? ` · ${t('admin.business.hidden')}` : ''}
                </p>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
