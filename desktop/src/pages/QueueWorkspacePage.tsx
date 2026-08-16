import { useEffect, useMemo, useState } from 'react';

import { getQueueErrorMessage, QueueError } from '@/domain/errors/queue-error';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import {
  useCallNext,
  useCloseQueue,
  usePauseQueue,
  useResumeQueue,
  useServeCustomer,
  useSkipCustomer,
  useStartServing,
} from '@/features/queue/hooks/use-queue-mutations';
import {
  useBusinessQueueDetails,
  useBusinessQueues,
  useWaitingCustomers,
} from '@/features/queue/hooks/use-queue-queries';
import { useBusinessQueueRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { formatRelativeTime, formatWaitTime } from '@/utils/formatting';
import { ConfirmDialog } from '@web/components/ConfirmDialog';
import { useTranslation } from '@/hooks/use-translation';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from '@web/components/ui';
import { useQueueActions } from '../lib/queue-actions';

export default function QueueWorkspacePage() {
  const { t } = useTranslation();
  const org = useMyOrganization();
  const queues = useBusinessQueues(org.data?.id);
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const [skipId, setSkipId] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { setActions } = useQueueActions();

  useEffect(() => {
    if (!selectedQueueId && queues.data?.[0]?.id) {
      setSelectedQueueId(queues.data[0].id);
    }
  }, [queues.data, selectedQueueId]);

  const queue = queues.data?.find((q) => q.id === selectedQueueId) ?? queues.data?.[0];
  useBusinessQueueRealtime(org.data?.id, queue?.id);
  const waiting = useWaitingCustomers(queue?.id);
  const details = useBusinessQueueDetails(queue?.id);
  const callNext = useCallNext();
  const startServing = useStartServing();
  const serve = useServeCustomer();
  const skip = useSkipCustomer();
  const pause = usePauseQueue();
  const resume = useResumeQueue();
  const closeQueue = useCloseQueue();

  const busy =
    callNext.isPending ||
    startServing.isPending ||
    serve.isPending ||
    skip.isPending ||
    pause.isPending ||
    resume.isPending ||
    closeQueue.isPending;

  const current = useMemo(
    () =>
      waiting.data?.find((c) => c.status === 'called' || c.status === 'serving') ??
      null,
    [waiting.data],
  );

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
      canCallNext: !busy && queue.status === 'active',
      canServe: !busy && Boolean(current),
      canTogglePause: !busy,
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
  }, [queue, current, busy, setActions]);

  if (queues.isLoading) return <LoadingSkeleton count={4} />;
  if (queues.isError) {
    return (
      <ErrorState
        title="Could not load queues"
        description={getQueueErrorMessage(queues.error)}
        onRetry={() => void queues.refetch()}
      />
    );
  }
  if (!queue) {
    return (
      <EmptyState
        title="No queues yet"
        description="Queues appear when customers join an active service."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('web.desktop.queueWorkspace')}</h1>
          <p className="text-sm text-ink-secondary">{t('web.desktop.shortcutsHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {queues.data?.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedQueueId(item.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                item.id === queue.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-surface-card text-ink'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{queue.name}</h2>
            <p className="text-sm text-ink-secondary">
              {queue.departmentName} · {queue.serviceName}
            </p>
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-ink-muted">{t('web.desktop.currentlyServing')}</p>
              <p className="text-2xl font-bold text-primary">{queue.currentServing || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">{t('web.desktop.waitingQueue')}</p>
              <p className="text-2xl font-bold">{queue.waitingCount}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">{t('profile.servedToday')}</p>
              <p className="text-2xl font-bold">{details.data?.completedToday ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">{t('web.analytics.avgWait')}</p>
              <p className="text-2xl font-bold">{queue.averageWaitMinutes} min</p>
            </div>
          </div>
          {message ? <p className="text-sm text-danger">{message}</p> : null}
          <div className="flex flex-col gap-2">
            <Button
              disabled={busy || queue.status !== 'active'}
              title={t('web.desktop.callNextHint')}
              onClick={() => void run('Call next', () => callNext.mutateAsync(queue.id))}
            >
              {t('web.desktop.callNextHint')}
            </Button>
            {queue.status === 'active' ? (
              <Button
                variant="ghost"
                disabled={busy}
                title={t('web.desktop.pauseHint')}
                onClick={() => void run('Pause', () => pause.mutateAsync(queue.id))}
              >
                {t('web.desktop.pauseHint')}
              </Button>
            ) : (
              <Button
                variant="ghost"
                disabled={busy}
                title={t('web.desktop.resumeHint')}
                onClick={() => void run('Resume', () => resume.mutateAsync(queue.id))}
              >
                {t('web.desktop.resumeHint')}
              </Button>
            )}
            <Button
              variant="danger"
              disabled={busy || queue.status === 'closed'}
              onClick={() => setCloseOpen(true)}
            >
              {t('web.desktop.closeQueue')}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('web.desktop.currentlyServing')}</h2>
          {current ? (
            <>
              <p className="text-5xl font-bold text-primary">{current.queueNumber}</p>
              <p className="text-xl">{current.customerName}</p>
              <p className="text-sm text-ink-secondary">
                {queue.serviceName} · {queue.departmentName}
              </p>
              <p className="text-sm text-ink-secondary">
                {formatRelativeTime(current.joinedAt)} ·{' '}
                {formatWaitTime(current.estimatedServiceMinutes)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  title={t('web.desktop.serveHint')}
                  onClick={() => void run('Serve', () => serve.mutateAsync(current.id))}
                >
                  {t('web.desktop.serveHint')}
                </Button>
                <Button variant="warning" disabled={busy} onClick={() => setSkipId(current.id)}>
                  {t('web.desktop.skip')}
                </Button>
                {current.status === 'waiting' ? (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      void run('Start serving', () => startServing.mutateAsync(current.id))
                    }
                  >
                    {t('web.desktop.startServing')}
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-ink-secondary">{t('web.desktop.noCurrent')}</p>
          )}
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{t('web.desktop.waitingQueue')}</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface-card">
          <table className="min-w-full text-start text-sm">
            <thead className="bg-surface text-ink-secondary">
              <tr>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.position')}</th>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.ticket')}</th>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.customer')}</th>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.service')}</th>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.department')}</th>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.waitingTime')}</th>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.status')}</th>
                <th className="px-3 py-3 font-semibold">{t('web.desktop.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(waiting.data ?? []).map((customer, index) => (
                <tr key={customer.id} className="border-t border-line">
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3 font-semibold">{customer.queueNumber}</td>
                  <td className="px-3 py-3">{customer.customerName}</td>
                  <td className="px-3 py-3">{queue.serviceName}</td>
                  <td className="px-3 py-3">{queue.departmentName}</td>
                  <td className="px-3 py-3">{formatRelativeTime(customer.joinedAt)}</td>
                  <td className="px-3 py-3">{customer.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        className="px-2 py-1 text-xs"
                        disabled={busy}
                        onClick={() => void run('Serve', () => serve.mutateAsync(customer.id))}
                      >
                        {t('web.desktop.serveHint')}
                      </Button>
                      <Button
                        className="px-2 py-1 text-xs"
                        variant="warning"
                        disabled={busy}
                        onClick={() => setSkipId(customer.id)}
                      >
                        {t('web.desktop.skip')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(waiting.data ?? []).length === 0 ? (
            <p className="p-4 text-sm text-ink-secondary">{t('web.desktop.queueClear')}</p>
          ) : null}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(skipId)}
        title={t('web.confirm.skipTitle')}
        body={t('web.confirm.skipBody')}
        confirmLabel={t('web.confirm.confirm')}
        cancelLabel={t('web.confirm.keep')}
        danger
        onCancel={() => setSkipId(null)}
        onConfirm={() => {
          if (skipId) void run('Skip', () => skip.mutateAsync(skipId));
          setSkipId(null);
        }}
      />
      <ConfirmDialog
        open={closeOpen}
        title={t('web.confirm.closeTitle')}
        body={t('web.confirm.closeBody')}
        confirmLabel={t('web.confirm.confirm')}
        cancelLabel={t('web.confirm.keep')}
        danger
        onCancel={() => setCloseOpen(false)}
        onConfirm={() => {
          void run('Close queue', () => closeQueue.mutateAsync(queue.id));
          setCloseOpen(false);
        }}
      />
    </div>
  );
}
