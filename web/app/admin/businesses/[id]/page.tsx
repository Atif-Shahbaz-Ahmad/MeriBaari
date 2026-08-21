'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { getSubscriptionErrorMessage } from '@/domain/errors/subscription-error';
import {
  useAdminBusiness,
  useSetAdminBusinessVisibility,
} from '@/features/subscription/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import type { OrganizationCategory } from '@/types/organization';
import { Button, Card, ErrorState, Input, LoadingSkeleton } from '@web/components/ui';
import { LocationMap } from '@web/components/LocationMap';

export default function AdminBusinessPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useAdminBusiness(id);
  const visibility = useSetAdminBusinessVisibility();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (query.isLoading) return <LoadingSkeleton count={3} />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title={t('admin.business.loadError')}
        description={getSubscriptionErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const business = query.data;
  const hidden = business.adminHidden;
  const busy = visibility.isPending;

  const onHide = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('admin.business.reasonRequired'));
      return;
    }
    setError(null);
    try {
      await visibility.mutateAsync({
        organizationId: business.id,
        visible: false,
        reason: trimmed,
      });
      setReason('');
    } catch (e) {
      setError(getSubscriptionErrorMessage(e));
    }
  };

  const onRestore = async () => {
    setError(null);
    try {
      await visibility.mutateAsync({
        organizationId: business.id,
        visible: true,
      });
    } catch (e) {
      setError(getSubscriptionErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="text-sm font-semibold text-primary"
        onClick={() => router.push('/admin')}
      >
        ← {t('admin.dashboard.title')}
      </button>
      <h1 className="text-3xl font-bold">{business.name}</h1>
      <Card className="space-y-2">
        <p>{t('admin.review.owner')}: {business.ownerName ?? '—'}</p>
        <p>
          {t('admin.review.category')}:{' '}
          {getOrganizationCategoryLabel(business.category as OrganizationCategory)}
        </p>
        <p>{t('admin.review.phone')}: {business.phone ?? '—'}</p>
        <p>
          {t('admin.review.address')}: {business.address || '—'}
          {business.city ? `, ${business.city}` : ''}
        </p>
        <LocationMap
          latitude={business.latitude}
          longitude={business.longitude}
          label={business.name}
          address={business.address}
        />
        <p>
          {t('admin.business.liveSince')}:{' '}
          {business.approvedAt
            ? new Date(business.approvedAt).toLocaleDateString()
            : '—'}
        </p>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('admin.business.visibilityTitle')}</h2>
        <p className="text-sm text-ink-secondary">{t('admin.business.visibilityBody')}</p>
        <p className={hidden ? 'font-semibold text-danger' : 'font-semibold text-ink'}>
          {hidden ? t('admin.business.hidden') : t('admin.business.visible')}
        </p>
        {hidden && business.adminHiddenReason ? (
          <p className="text-sm">
            {t('admin.business.hiddenReason')}: {business.adminHiddenReason}
          </p>
        ) : null}
        {hidden ? (
          <Button disabled={busy} onClick={() => void onRestore()}>
            {t('admin.business.confirmRestore')}
          </Button>
        ) : (
          <>
            <Input
              label={t('admin.business.reasonLabel')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.business.reasonPlaceholder')}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button variant="danger" disabled={busy} onClick={() => void onHide()}>
              {t('admin.business.confirmHide')}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
