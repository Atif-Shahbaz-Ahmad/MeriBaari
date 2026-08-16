'use client';

import { useMemo } from 'react';

import { useOwnerHistory } from '@/features/history/hooks/use-owner-history';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useTranslation } from '@/hooks/use-translation';
import { Card, EmptyState, LoadingSkeleton } from '@web/components/ui';

export default function BusinessAnalyticsPage() {
  const { t } = useTranslation();
  const org = useMyOrganization();
  const history = useOwnerHistory(org.data?.id, { limit: 200 });

  const stats = useMemo(() => {
    const tickets = history.data ?? [];
    const served = tickets.filter((tkt) => tkt.status === 'served' || tkt.status === 'completed');
    const skipped = tickets.filter((tkt) => tkt.status === 'skipped');
    const cancelled = tickets.filter((tkt) => tkt.status === 'cancelled');
    const waits = served
      .map((tkt) => tkt.actualWaitMinutes)
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    const avgWait =
      waits.length > 0 ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null;
    const byService = new Map<string, number>();
    for (const ticket of tickets) {
      byService.set(ticket.serviceName, (byService.get(ticket.serviceName) ?? 0) + 1);
    }
    const byDay = new Map<string, number>();
    for (const ticket of tickets) {
      const day = (ticket.completedAt || ticket.cancelledAt || ticket.joinedAt).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    return { served: served.length, skipped: skipped.length, cancelled: cancelled.length, avgWait, byService, byDay };
  }, [history.data]);

  if (history.isLoading) return <LoadingSkeleton />;
  if (!history.data?.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t('web.analytics.title')}</h1>
        <EmptyState title={t('web.analytics.empty')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('web.analytics.title')}</h1>
        <p className="text-ink-secondary">{t('web.analytics.subtitle')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-ink-muted">{t('web.analytics.served')}</p>
          <p className="text-2xl font-bold">{stats.served}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">{t('web.analytics.skipped')}</p>
          <p className="text-2xl font-bold">{stats.skipped}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">{t('web.analytics.cancelled')}</p>
          <p className="text-2xl font-bold">{stats.cancelled}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">{t('web.analytics.avgWait')}</p>
          <p className="text-2xl font-bold">{stats.avgWait == null ? '—' : `${stats.avgWait} min`}</p>
        </Card>
      </div>
      <Card>
        <h2 className="mb-3 font-semibold">{t('web.analytics.byService')}</h2>
        <ul className="space-y-1 text-sm">
          {[...stats.byService.entries()].map(([name, count]) => (
            <li key={name} className="flex justify-between">
              <span>{name}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">{t('web.analytics.byDay')}</h2>
        <ul className="space-y-1 text-sm">
          {[...stats.byDay.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 14)
            .map(([day, count]) => (
              <li key={day} className="flex justify-between">
                <span>{day}</span>
                <span>{count}</span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
