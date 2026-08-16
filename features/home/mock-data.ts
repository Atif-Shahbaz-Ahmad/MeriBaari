import type { QueueTicket } from '@/types';
import { dataAccess, getContainer } from '@/data';

const MOCK_TICKETS = getContainer().mockTicketRepository.getSeedTickets();

/** @deprecated Prefer live ticket queries — kept for leftover mock helpers */
export const mockCurrentTicket: QueueTicket =
  dataAccess.getPrimaryActiveTicket(MOCK_TICKETS) ?? MOCK_TICKETS[0];

export const mockProgressSequence = dataAccess.getProgressSequence(mockCurrentTicket.id);

export const mockNotifications = [
  {
    id: 'n1',
    title: 'Your turn is coming up',
    body: 'Ticket A-127 — about 2 people ahead at City Hospital.',
    time: '10 min ago',
    group: 'Today' as const,
    type: 'reminder' as const,
  },
  {
    id: 'n2',
    title: 'Joined queue successfully',
    body: 'You joined General OPD. Ticket A-127.',
    time: '18 min ago',
    group: 'Today' as const,
    type: 'joined' as const,
  },
  {
    id: 'n3',
    title: 'Queue completed',
    body: 'Thanks for visiting HBL Branch.',
    time: 'Yesterday',
    group: 'Yesterday' as const,
    type: 'completed' as const,
  },
];

/** @deprecated Prefer MOCK_PROFILE_STATS from @/data */
export const mockProfileStats = {
  queuesJoined: 28,
  timeSavedHours: 18,
  favoritePlaces: 5,
};
