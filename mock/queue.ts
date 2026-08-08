import type { QueueProgressDetails, QueueTimelineEntry } from '@/types';



import { getTicketById } from './tickets';



function buildTimeline(

  currentServing: string,

  yourTicket: string,

  prefix: string,

  yourNum: number,

): QueueTimelineEntry[] {

  const servingNum = Number.parseInt(currentServing.split('-')[1] ?? '0', 10);

  const entries: QueueTimelineEntry[] = [];



  // Numbers from serving through a few ahead of user

  const start = Math.min(servingNum, yourNum - 2);

  const end = yourNum + 2;



  for (let n = start; n <= end; n += 1) {

    if (n < 1) continue;

    const ticketNumber = `${prefix}-${String(n).padStart(3, '0')}`;

    entries.push({

      ticketNumber,

      isYou: ticketNumber === yourTicket,

      isServing: ticketNumber === currentServing,

      isPast: n < servingNum,

      label: ticketNumber === yourTicket ? 'YOU' : undefined,

    });

  }



  return entries;

}



/** Detailed queue progress keyed by ticket id. */

export const MOCK_QUEUE_PROGRESS: Record<string, QueueProgressDetails> = {

  'ticket-1': {

    queueId: 'queue-ch-gen-opd',

    ticketId: 'ticket-1',

    capacity: 80,

    currentPosition: 4,

    peopleRemaining: 3,

    averageServiceMinutes: 4,

    estimatedFinishAt: new Date(Date.now() + 12 * 60_000).toISOString(),

    currentServing: 'A-124',

    queueSpeed: 15,

    lastUpdatedAt: new Date(Date.now() - 45_000).toISOString(),

    timeline: buildTimeline('A-124', 'A-127', 'A', 127),

  },

  'ticket-2': {

    queueId: 'queue-hbl-teller',

    ticketId: 'ticket-2',

    capacity: 40,

    currentPosition: 2,

    peopleRemaining: 1,

    averageServiceMinutes: 3,

    estimatedFinishAt: new Date(Date.now() + 4 * 60_000).toISOString(),

    currentServing: 'B-057',

    queueSpeed: 20,

    lastUpdatedAt: new Date(Date.now() - 20_000).toISOString(),

    timeline: buildTimeline('B-057', 'B-058', 'B', 58),

  },

  'ticket-3': {

    queueId: 'queue-nadra-cnic',

    ticketId: 'ticket-3',

    capacity: 60,

    currentPosition: 1,

    peopleRemaining: 0,

    averageServiceMinutes: 8,

    estimatedFinishAt: new Date(Date.now() + 8 * 60_000).toISOString(),

    currentServing: 'C-214',

    queueSpeed: 7,

    lastUpdatedAt: new Date(Date.now() - 10_000).toISOString(),

    timeline: buildTimeline('C-214', 'C-214', 'C', 214),

  },

};



export function getQueueProgress(ticketId: string): QueueProgressDetails | undefined {

  if (MOCK_QUEUE_PROGRESS[ticketId]) {

    return MOCK_QUEUE_PROGRESS[ticketId];

  }



  const ticket = getTicketById(ticketId);

  if (!ticket) return undefined;



  const prefix = ticket.ticketNumber.split('-')[0] ?? 'A';

  const yourNum = Number.parseInt(ticket.ticketNumber.split('-')[1] ?? '0', 10);

  const servingNum = Number.parseInt(ticket.currentServing.split('-')[1] ?? '0', 10);



  return {

    queueId: ticket.queueId,

    ticketId: ticket.id,

    capacity: 50,

    currentPosition: ticket.position,

    peopleRemaining: ticket.peopleAhead,

    averageServiceMinutes: Math.max(3, Math.round(ticket.estimatedWaitMinutes / Math.max(ticket.peopleAhead, 1))),

    estimatedFinishAt:

      ticket.estimatedCompletionAt ??

      new Date(Date.now() + ticket.estimatedWaitMinutes * 60_000).toISOString(),

    currentServing: ticket.currentServing,

    queueSpeed: Math.max(5, Math.round(60 / Math.max(3, ticket.estimatedWaitMinutes / Math.max(ticket.peopleAhead, 1)))),

    lastUpdatedAt: new Date().toISOString(),

    timeline: buildTimeline(ticket.currentServing, ticket.ticketNumber, prefix, yourNum || servingNum),

  };

}



/** Horizontal progress sequence for Home ProgressCard (ticket numbers). */

export function getProgressSequence(ticketId: string): string[] {

  const progress = getQueueProgress(ticketId);

  if (!progress) return [];

  return progress.timeline.map((e) => e.ticketNumber);

}

