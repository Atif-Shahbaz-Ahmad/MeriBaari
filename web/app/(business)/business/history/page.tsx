'use client';

import { useOwnerHistory } from '@/features/history/hooks/use-owner-history';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { formatRelativeTime } from '@/utils/formatting';
import { Card, EmptyState, LoadingSkeleton, StatusBadge } from '@web/components/ui';

export default function BusinessHistoryPage() {
  const org = useMyOrganization();
  const history = useOwnerHistory(org.data?.id, { limit: 80 });

  if (history.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">History</h1>
      {history.data?.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-card">
              <tr>
                <th className="px-3 py-2">Ticket</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {history.data.map((ticket) => (
                <tr key={ticket.id} className="border-t border-line">
                  <td className="px-3 py-2">{ticket.ticketNumber}</td>
                  <td className="px-3 py-2">{ticket.serviceName}</td>
                  <td className="px-3 py-2">{ticket.departmentName}</td>
                  <td className="px-3 py-2">
                    <StatusBadge label={ticket.status} />
                  </td>
                  <td className="px-3 py-2">
                    {formatRelativeTime(ticket.completedAt || ticket.cancelledAt || ticket.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No history yet" />
      )}
    </div>
  );
}
