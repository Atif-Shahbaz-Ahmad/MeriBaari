'use client';

import { useMemo, useState } from 'react';

import { useCustomerHistory } from '@/features/history/hooks/use-customer-history';
import {
  useMyActiveTicket,
  useTicketProgress,
} from '@/features/queue/hooks/use-queue-queries';
import { useCancelQueue } from '@/features/queue/hooks/use-queue-mutations';
import { useMyTicketsRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useTranslation } from '@/hooks/use-translation';
import { formatRelativeTime } from '@/utils/formatting';
import { ConfirmDialog } from '@web/components/ConfirmDialog';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from '@web/components/ui';

export default function CustomerTicketsPage() {
  const { t } = useTranslation();
  const active = useMyActiveTicket();
  useMyTicketsRealtime(active.data?.queueId);
  const progress = useTicketProgress(active.data?.id);
  const history = useCustomerHistory();
  const cancel = useCancelQueue();
  const [confirm, setConfirm] = useState(false);

  const tone = useMemo(() => {
    const status = active.data?.status;
    if (status === 'called' || status === 'serving') return 'secondary' as const;
    if (status === 'cancelled' || status === 'skipped') return 'error' as const;
    return 'primary' as const;
  }, [active.data?.status]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('tickets.title') === 'tickets.title' ? 'Tickets' : t('tickets.title')}</h1>
      {active.isLoading ? (
        <LoadingSkeleton count={1} />
      ) : active.isError ? (
        <ErrorState title="Could not load ticket" onRetry={() => void active.refetch()} />
      ) : active.data ? (
        <Card className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-muted">Active ticket</p>
              <p className="text-3xl font-bold text-primary">{active.data.ticketNumber}</p>
            </div>
            <StatusBadge label={active.data.status} tone={tone} />
          </div>
          <p>{active.data.organizationName}</p>
          <p className="text-sm text-ink-secondary">
            {active.data.departmentName} · {active.data.serviceName}
          </p>
          <p className="text-sm">
            Position {active.data.position} · {active.data.peopleAhead} ahead
          </p>
          {active.data.estimatedWaitMinutes ? (
            <p className="text-sm">Est. wait {active.data.estimatedWaitMinutes} min</p>
          ) : null}
          <p className="text-xs text-ink-muted">
            Created {formatRelativeTime(active.data.joinedAt)}
          </p>
          {progress.data ? (
            <p className="text-sm text-ink-secondary">
              Now serving {progress.data.currentServing ?? '—'}
            </p>
          ) : null}
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Cancel ticket
          </Button>
        </Card>
      ) : (
        <EmptyState title="No active ticket" description="Join a queue to get a ticket." />
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">History</h2>
        {history.isLoading ? (
          <LoadingSkeleton />
        ) : history.data?.length ? (
          <ul className="space-y-2">
            {history.data.map((ticket) => (
              <li key={ticket.id}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{ticket.ticketNumber}</p>
                    <p className="text-sm text-ink-secondary">
                      {ticket.organizationName} · {ticket.serviceName}
                    </p>
                  </div>
                  <StatusBadge label={ticket.status} />
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No past tickets" />
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title={t('web.confirm.cancelTicketTitle')}
        body={t('web.confirm.cancelTicketBody')}
        confirmLabel={t('web.confirm.confirm')}
        cancelLabel={t('web.confirm.keep')}
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (active.data) void cancel.mutateAsync(active.data.id);
          setConfirm(false);
        }}
      />
    </div>
  );
}
