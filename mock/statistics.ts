import type { QueueTicket, TicketStatistics } from '@/types';

export type TicketStatsInput = Pick<
  QueueTicket,
  'status' | 'organizationName' | 'estimatedWaitMinutes'
> & {
  actualWaitMinutes?: number;
  completedAt?: string;
  joinedAt?: string;
};

export const EMPTY_TICKET_STATISTICS: TicketStatistics = {
  queuesJoined: 0,
  hoursSaved: 0,
  averageWaitingMinutes: 0,
  favoriteOrganization: '',
};

export const MOCK_TICKET_STATISTICS: TicketStatistics = {
  queuesJoined: 28,
  hoursSaved: 18.5,
  averageWaitingMinutes: 22,
  favoriteOrganization: 'City Hospital',
};

/** Derive lightweight stats from a ticket list. Empty lists yield zeros — never mock floors. */
export function computeTicketStatistics(
  tickets: TicketStatsInput[] = [],
): TicketStatistics {
  const completed = tickets.filter(
    (t) => t.status === 'completed' || t.status === 'served',
  );
  const waits = completed
    .map((t) => t.actualWaitMinutes)
    .filter((m): m is number => typeof m === 'number');
  const avgWait =
    waits.length > 0
      ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length)
      : 0;

  const orgCounts = new Map<string, number>();
  for (const t of tickets) {
    if (!t.organizationName) continue;
    orgCounts.set(t.organizationName, (orgCounts.get(t.organizationName) ?? 0) + 1);
  }

  let favorite = '';
  let max = 0;
  for (const [name, count] of orgCounts) {
    if (count > max) {
      max = count;
      favorite = name;
    }
  }

  const estimatedWithoutApp = tickets.length * 45;
  const actualWait =
    waits.reduce((a, b) => a + b, 0) +
    tickets
      .filter(
        (t) =>
          t.status === 'waiting' ||
          t.status === 'almost' ||
          t.status === 'serving' ||
          t.status === 'called',
      )
      .reduce((a, t) => a + t.estimatedWaitMinutes, 0);
  const hoursSaved = Math.max(
    0,
    Math.round(((estimatedWithoutApp - actualWait) / 60) * 10) / 10,
  );

  return {
    queuesJoined: tickets.length,
    hoursSaved,
    averageWaitingMinutes: avgWait,
    favoriteOrganization: favorite,
  };
}

export function countServedToday(
  tickets: TicketStatsInput[],
  now = new Date(),
): number {
  return tickets.filter((ticket) => {
    if (ticket.status !== 'completed' && ticket.status !== 'served') return false;
    const stamp = ticket.completedAt ?? ticket.joinedAt;
    if (!stamp) return false;
    const d = new Date(stamp);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;
}
