'use client';

import { useOwnerHistory } from '@/features/history/hooks/use-owner-history';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { Card, EmptyState, LoadingSkeleton, StatusBadge } from '@web/components/ui';

export default function BusinessTicketsPage() {
  const org = useMyOrganization();
  const history = useOwnerHistory(org.data?.id, { limit: 50 });

  if (history.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Tickets</h1>
      {history.data?.length ? (
        <ul className="space-y-2">
          {history.data.map((ticket) => (
            <li key={ticket.id}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{ticket.ticketNumber}</p>
                  <p className="text-sm text-ink-secondary">
                    {ticket.serviceName} · {ticket.departmentName}
                  </p>
                </div>
                <StatusBadge label={ticket.status} />
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No tickets yet" />
      )}
    </div>
  );
}
