import type { QueueTicket } from '@/types';



import {

  getCancelledTickets,

  getCompletedTickets,

  MOCK_TICKETS,

} from './tickets';



export type HistoryGroup = {

  title: string;

  data: QueueTicket[];

};



function dayKey(iso: string): string {

  const d = new Date(iso);

  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

}



function dayLabel(iso: string): string {

  const d = new Date(iso);

  const today = new Date();

  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);



  if (dayKey(iso) === dayKey(today.toISOString())) return 'Today';

  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Yesterday';



  return d.toLocaleDateString('en-PK', {

    weekday: 'short',

    month: 'short',

    day: 'numeric',

  });

}



/** Historical tickets (completed, cancelled, missed) sorted newest first. */

export function getHistoryTickets(tickets: QueueTicket[] = MOCK_TICKETS): QueueTicket[] {

  return tickets

    .filter((t) => t.status === 'completed' || t.status === 'cancelled' || t.status === 'missed')

    .sort((a, b) => {

      const aTime = new Date(a.completedAt ?? a.cancelledAt ?? a.joinedAt).getTime();

      const bTime = new Date(b.completedAt ?? b.cancelledAt ?? b.joinedAt).getTime();

      return bTime - aTime;

    });

}



export function groupTicketsByDate(tickets: QueueTicket[]): HistoryGroup[] {

  const map = new Map<string, QueueTicket[]>();



  for (const ticket of tickets) {

    const iso = ticket.completedAt ?? ticket.cancelledAt ?? ticket.joinedAt;

    const label = dayLabel(iso);

    const existing = map.get(label) ?? [];

    existing.push(ticket);

    map.set(label, existing);

  }



  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));

}



export function filterHistoryTickets(

  tickets: QueueTicket[],

  query: string,

  statusFilter: 'all' | 'completed' | 'cancelled' | 'missed',

): QueueTicket[] {

  const q = query.trim().toLowerCase();



  return tickets.filter((t) => {

    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    if (!q) return true;

    return (

      t.organizationName.toLowerCase().includes(q) ||

      t.serviceName.toLowerCase().includes(q) ||

      t.departmentName.toLowerCase().includes(q) ||

      t.ticketNumber.toLowerCase().includes(q)

    );

  });

}



export { getCancelledTickets, getCompletedTickets };

