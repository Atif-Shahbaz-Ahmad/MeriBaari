import type { TicketStatistics } from '@/types';



import { MOCK_TICKETS } from './tickets';



export const MOCK_TICKET_STATISTICS: TicketStatistics = {

  queuesJoined: 28,

  hoursSaved: 18.5,

  averageWaitingMinutes: 22,

  favoriteOrganization: 'City Hospital',

};



/** Derive lightweight stats from the current ticket list (mock-friendly). */

export function computeTicketStatistics(tickets = MOCK_TICKETS): TicketStatistics {

  const completed = tickets.filter((t) => t.status === 'completed');

  const waits = completed

    .map((t) => t.actualWaitMinutes)

    .filter((m): m is number => typeof m === 'number');

  const avgWait =

    waits.length > 0 ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : MOCK_TICKET_STATISTICS.averageWaitingMinutes;



  const orgCounts = new Map<string, number>();

  for (const t of tickets) {

    orgCounts.set(t.organizationName, (orgCounts.get(t.organizationName) ?? 0) + 1);

  }

  let favorite = MOCK_TICKET_STATISTICS.favoriteOrganization;

  let max = 0;

  for (const [name, count] of orgCounts) {

    if (count > max) {

      max = count;

      favorite = name;

    }

  }



  const estimatedWithoutApp = tickets.length * 45;

  const actualWait = waits.reduce((a, b) => a + b, 0) + tickets.filter((t) => t.status === 'waiting' || t.status === 'almost' || t.status === 'serving').reduce((a, t) => a + t.estimatedWaitMinutes, 0);

  const hoursSaved = Math.max(0, Math.round(((estimatedWithoutApp - actualWait) / 60) * 10) / 10);



  return {

    queuesJoined: Math.max(tickets.length, MOCK_TICKET_STATISTICS.queuesJoined),

    hoursSaved: Math.max(hoursSaved, MOCK_TICKET_STATISTICS.hoursSaved),

    averageWaitingMinutes: avgWait,

    favoriteOrganization: favorite,

  };

}

