import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { isOrganizationPublic } from '@/domain/models';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { getQueueErrorMessage, QueueError } from '@/domain/errors/queue-error';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useBusinessQueues, useWaitingCustomers } from '@/features/queue/hooks/use-queue-queries';
import { useBusinessQueueRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useCallNext, usePauseQueue, useResumeQueue, useServeCustomer } from '@/features/queue/hooks/use-queue-mutations';
import { useOrganizationServedToday } from '@/features/history/hooks/use-organization-served-today';
import { useOwnerHistory } from '@/features/history/hooks/use-owner-history';
import { useMyLatestPayment } from '@/features/subscription/hooks/use-subscription';
import { formatRelativeTime } from '@/utils/formatting';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from '@web/components/ui';
import { useQueueActions } from '../lib/queue-actions';

export default function BusinessDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const orgQuery = useMyOrganization();
  const organization = orgQuery.data;
  const queues = useBusinessQueues(organization?.id);
  const queue = queues.data?.[0];
  useBusinessQueueRealtime(organization?.id, queue?.id);
  const waiting = useWaitingCustomers(queue?.id);
  const served = useOrganizationServedToday(organization?.id);
  const history = useOwnerHistory(organization?.id, { limit: 8 });
  const payment = useMyLatestPayment(organization?.id);
  const callNext = useCallNext();
  const pause = usePauseQueue();
  const resume = useResumeQueue();
  const serve = useServeCustomer();
  const { setActions } = useQueueActions();
  const [message, setMessage] = useState<string | null>(null);

  const current = useMemo(
    () =>
      waiting.data?.find((c) => c.status === 'called' || c.status === 'serving') ??
      null,
    [waiting.data],
  );
  const waitingOnly = (waiting.data ?? []).filter((c) => c.status === 'waiting');

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
      setMessage(null);
    } catch (e) {
      if (e instanceof QueueError && e.code === 'no_customers_waiting') {
        setMessage('No customers are waiting.');
        return;
      }
      setMessage(`${label}: ${getQueueErrorMessage(e)}`);
    }
  };

  useEffect(() => {
    if (!queue) {
      setActions({});
      return;
    }
    setActions({
      canCallNext: queue.status === 'active' && !callNext.isPending,
      canServe: Boolean(current) && !serve.isPending,
      canTogglePause: !pause.isPending && !resume.isPending,
      callNext: () => void run('Call next', () => callNext.mutateAsync(queue.id)),
      serve: current
        ? () => void run('Serve', () => serve.mutateAsync(current.id))
        : undefined,
      togglePause: () =>
        void run(
          queue.status === 'active' ? 'Pause' : 'Resume',
          () =>
            queue.status === 'active'
              ? pause.mutateAsync(queue.id)
              : resume.mutateAsync(queue.id),
        ),
    });
    return () => setActions({});
  }, [
    queue,
    current,
    callNext.isPending,
    serve.isPending,
    pause.isPending,
    resume.isPending,
    setActions,
  ]);

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
  const waitingCount = queues.data?.reduce((sum, q) => sum + q.waitingCount, 0) ?? 0;
  const avgWait =
    queues.data && queues.data.length > 0
      ? Math.round(
          queues.data.reduce((sum, q) => sum + q.averageWaitMinutes, 0) /
            queues.data.length,
        )
      : organization.averageWaitMinutes ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            {t('business.dashboard.greeting', {
              name: user?.fullName?.split(' ')[0] ?? '',
            })}
          </h1>
          <p className="text-sm text-ink-secondary">{t('web.desktop.shortcutsHint')}</p>
        </div>
        <Link className="text-sm font-semibold text-primary" to="/business/queue">
          {t('web.desktop.queueWorkspace')}
        </Link>
      </div>

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
          <p className="text-3xl font-bold">{waitingCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">{t('profile.servedToday')}</p>
          <p className="text-3xl font-bold">{served.data ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Avg wait</p>
          <p className="text-3xl font-bold">{avgWait} min</p>
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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('web.desktop.currentlyServing')}</h2>
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
            ) : null}
          </div>
          {current ? (
            <>
              <p className="text-4xl font-bold text-primary">{current.queueNumber}</p>
              <p className="text-lg">{current.customerName}</p>
              <p className="text-sm text-ink-secondary">
                {formatRelativeTime(current.joinedAt)}
              </p>
            </>
          ) : (
            <p className="text-ink-secondary">{t('web.desktop.noCurrent')}</p>
          )}
          {message ? <p className="text-sm text-danger">{message}</p> : null}
          {queue ? (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={callNext.isPending || queue.status !== 'active'}
                title={t('web.desktop.callNextHint')}
                onClick={() => void run('Call next', () => callNext.mutateAsync(queue.id))}
              >
                {t('web.desktop.callNextHint')}
              </Button>
              <Button
                disabled={!current || serve.isPending}
                title={t('web.desktop.serveHint')}
                onClick={() =>
                  current
                    ? void run('Serve', () => serve.mutateAsync(current.id))
                    : undefined
                }
              >
                {t('web.desktop.serveHint')}
              </Button>
              {queue.status === 'active' ? (
                <Button
                  variant="ghost"
                  title={t('web.desktop.pauseHint')}
                  onClick={() => void run('Pause', () => pause.mutateAsync(queue.id))}
                >
                  {t('web.desktop.pauseHint')}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  title={t('web.desktop.resumeHint')}
                  onClick={() => void run('Resume', () => resume.mutateAsync(queue.id))}
                >
                  {t('web.desktop.resumeHint')}
                </Button>
              )}
            </div>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">{t('web.desktop.waitingQueue')}</h2>
          {waitingOnly.length === 0 ? (
            <p className="text-sm text-ink-secondary">{t('web.desktop.queueClear')}</p>
          ) : (
            <ol className="space-y-2">
              {waitingOnly.slice(0, 8).map((customer, index) => (
                <li
                  key={customer.id}
                  className="flex items-center justify-between rounded-xl border border-line px-3 py-2"
                >
                  <span className="font-semibold">
                    {index + 1}. {customer.queueNumber}
                  </span>
                  <span className="text-sm text-ink-secondary">{customer.customerName}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('web.desktop.recentActivity')}</h2>
        {(history.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-secondary">{t('web.analytics.empty')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {(history.data ?? []).map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold">{ticket.ticketNumber}</span>
                <span className="text-ink-secondary">
                  {ticket.serviceName} · {ticket.status}
                </span>
                <span className="text-ink-muted">
                  {formatRelativeTime(
                    ticket.completedAt || ticket.cancelledAt || ticket.joinedAt,
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
