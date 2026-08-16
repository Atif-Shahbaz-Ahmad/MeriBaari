'use client';

import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useBusinessQueues, useWaitingCustomers } from '@/features/queue/hooks/use-queue-queries';
import { useBusinessQueueRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { Card, EmptyState, LoadingSkeleton } from '@web/components/ui';

export default function BusinessCustomersPage() {
  const org = useMyOrganization();
  const queues = useBusinessQueues(org.data?.id);
  const queue = queues.data?.[0];
  useBusinessQueueRealtime(org.data?.id, queue?.id);
  const waiting = useWaitingCustomers(queue?.id);

  if (queues.isLoading || waiting.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Customers</h1>
      {(waiting.data ?? []).length === 0 ? (
        <EmptyState title="No waiting customers" />
      ) : (
        <ul className="space-y-2">
          {waiting.data!.map((customer) => (
            <li key={customer.id}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{customer.queueNumber}</p>
                  <p className="text-sm text-ink-secondary">{customer.customerName}</p>
                </div>
                <p className="text-sm">{customer.status}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
