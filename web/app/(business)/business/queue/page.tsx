'use client';

import { useEffect, useState } from 'react';

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

export default function BusinessQueuePage() {
  const { t } = useTranslation();
  const org = useMyOrganization();
  const queues = useBusinessQueues(org.data?.id);
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const [skipId, setSkipId] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const current =
    waiting.data?.find((c) => c.status === 'called' || c.status === 'serving') ??
    waiting.data?.[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Queue</h1>
      <div className="flex flex-wrap gap-2">
        {queues.data?.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedQueueId(item.id)}
            className={`rounded-full border px-4 py-2 text-sm ${
              item.id === queue.id
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-surface-card'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-muted">Current</p>
            <p className="text-2xl font-bold text-primary">{queue.currentServing || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Waiting</p>
            <p className="text-2xl font-bold">{queue.waitingCount}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Served today</p>
            <p className="text-2xl font-bold">{details.data?.completedToday ?? 0}</p>
          </div>
        </div>
        {message ? <p className="text-sm text-danger">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || queue.status !== 'active'}
            onClick={() => void run('Call next', () => callNext.mutateAsync(queue.id))}
          >
            Call next
          </Button>
          {queue.status === 'active' ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void run('Pause', () => pause.mutateAsync(queue.id))}
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void run('Resume', () => resume.mutateAsync(queue.id))}
            >
              Resume
            </Button>
          )}
          <Button
            variant="danger"
            disabled={busy || queue.status === 'closed'}
            onClick={() => setCloseOpen(true)}
          >
            Close queue
          </Button>
        </div>
      </Card>

      {current ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">Currently serving</h2>
          <p className="text-2xl font-bold">{current.queueNumber}</p>
          <p>{current.customerName}</p>
          <p className="text-sm text-ink-secondary">
            Waiting {formatRelativeTime(current.joinedAt)} ·{' '}
            {formatWaitTime(current.estimatedServiceMinutes)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={() => void run('Serve', () => serve.mutateAsync(current.id))}
            >
              Serve
            </Button>
            <Button
              variant="warning"
              disabled={busy}
              onClick={() => setSkipId(current.id)}
            >
              Skip
            </Button>
            {current.status === 'waiting' ? (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  void run('Start serving', () => startServing.mutateAsync(current.id))
                }
              >
                Start serving
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Waiting queue</h2>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-card">
              <tr>
                <th className="px-3 py-2">Ticket</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Wait</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(waiting.data ?? []).map((customer, index) => (
                <tr key={customer.id} className="border-t border-line">
                  <td className="px-3 py-2 font-semibold">{customer.queueNumber}</td>
                  <td className="px-3 py-2">{customer.customerName}</td>
                  <td className="px-3 py-2">{customer.status}</td>
                  <td className="px-3 py-2">{formatRelativeTime(customer.joinedAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        className="px-2 py-1 text-xs"
                        disabled={busy}
                        onClick={() =>
                          void run('Serve', () => serve.mutateAsync(customer.id))
                        }
                      >
                        Serve
                      </Button>
                      <Button
                        className="px-2 py-1 text-xs"
                        variant="warning"
                        disabled={busy}
                        onClick={() => setSkipId(customer.id)}
                      >
                        Skip
                      </Button>
                    </div>
                    <span className="sr-only">Position {index + 1}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(waiting.data ?? []).length === 0 ? (
            <p className="p-4 text-sm text-ink-secondary">Queue is clear.</p>
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
