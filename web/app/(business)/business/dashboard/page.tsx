'use client';

import Link from 'next/link';

import { isOrganizationPublic } from '@/domain/models';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useBusinessQueues } from '@/features/queue/hooks/use-queue-queries';
import { useBusinessQueueRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useCallNext, usePauseQueue, useResumeQueue } from '@/features/queue/hooks/use-queue-mutations';
import { useOrganizationServedToday } from '@/features/history/hooks/use-organization-served-today';
import { useMyLatestPayment } from '@/features/subscription/hooks/use-subscription';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from '@web/components/ui';

export default function BusinessDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const orgQuery = useMyOrganization();
  const organization = orgQuery.data;
  const queues = useBusinessQueues(organization?.id);
  useBusinessQueueRealtime(organization?.id, queues.data?.[0]?.id);
  const served = useOrganizationServedToday(organization?.id);
  const payment = useMyLatestPayment(organization?.id);
  const callNext = useCallNext();
  const pause = usePauseQueue();
  const resume = useResumeQueue();
  const queue = queues.data?.[0];
  const waiting = queues.data?.reduce((sum, q) => sum + q.waitingCount, 0) ?? 0;
  const avgWait =
    queues.data && queues.data.length > 0
      ? Math.round(
          queues.data.reduce((sum, q) => sum + q.averageWaitMinutes, 0) /
            queues.data.length,
        )
      : organization?.averageWaitMinutes ?? 0;

  if (orgQuery.isLoading) return <LoadingSkeleton count={4} />;
  if (orgQuery.isError) {
    return (
      <ErrorState
        title={t('business.dashboard.loadOrgError')}
        description={getOrganizationErrorMessage(orgQuery.error)}
        onRetry={() => void orgQuery.refetch()}
      />
    );
  }
  if (!organization) {
    return (
      <EmptyState
        title="Create your business"
        description="Set up your organization to start managing queues."
      />
    );
  }

  const visible = isOrganizationPublic(organization);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {t('business.dashboard.greeting', {
          name: user?.fullName?.split(' ')[0] ?? '',
        })}
      </h1>

      <Card
        className={
          organization.adminHidden
            ? 'border-red-300 bg-red-50 dark:border-red-500 dark:bg-[#450A0A]'
            : visible
            ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-[#14532D]'
            : 'border-amber-300 bg-amber-50 dark:border-amber-500 dark:bg-[#422006]'
        }
      >
        <p className="font-semibold text-ink">
          {organization.adminHidden
            ? t('subscription.status.adminHiddenTitle')
            : visible
              ? t('subscription.status.activeTitle')
              : t('subscription.status.activeHiddenTitle')}
        </p>
        <p className="text-sm text-ink">
          {organization.adminHidden
            ? t('subscription.status.adminHiddenBody')
            : visible
              ? t('subscription.status.activeBody')
              : t('subscription.status.activeHiddenBody')}
        </p>
        {payment.data?.status ? (
          <p className="mt-2 text-xs text-ink-secondary">
            Payment: {payment.data.status}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-ink-muted">Waiting</p>
          <p className="text-2xl font-bold">{waiting}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">{t('profile.servedToday')}</p>
          <p className="text-2xl font-bold">{served.data ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Avg wait</p>
          <p className="text-2xl font-bold">{avgWait} min</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Queue</p>
          {queue ? (
            <StatusBadge
              label={queue.status}
              tone={
                queue.status === 'active'
                  ? 'secondary'
                  : queue.status === 'paused'
                    ? 'accent'
                    : 'error'
              }
            />
          ) : (
            <p>—</p>
          )}
        </Card>
      </div>

      {queue ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{queue.name}</p>
              <p className="text-sm text-ink-secondary">
                Now serving {queue.currentServing || '—'}
              </p>
            </div>
            <Link className="text-sm font-semibold text-primary" href="/business/queue">
              Open queue
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={callNext.isPending || queue.status !== 'active'}
              onClick={() => void callNext.mutateAsync(queue.id)}
            >
              {t('business.dashboard.callNext')}
            </Button>
            {queue.status === 'active' ? (
              <Button variant="ghost" onClick={() => void pause.mutateAsync(queue.id)}>
                {t('business.dashboard.pauseQueue')}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => void resume.mutateAsync(queue.id)}>
                {t('business.dashboard.resumeQueue')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <EmptyState
          title={t('business.dashboard.noQueuesTitle')}
          description={t('business.dashboard.noQueuesDescription')}
        />
      )}
    </div>
  );
}
