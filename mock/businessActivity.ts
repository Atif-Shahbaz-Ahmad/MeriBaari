import type { BusinessActivityItem } from '@/types';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const MOCK_BUSINESS_ACTIVITY: BusinessActivityItem[] = [
  {
    id: 'ba-1',
    queueId: 'bq-general-opd',
    queueName: 'General OPD',
    type: 'called',
    title: 'Called A-042',
    subtitle: 'Ahmed’s ticket is now being served at Counter 03',
    ticketNumber: 'A-042',
    timestamp: minutesAgo(2),
  },
  {
    id: 'ba-2',
    queueId: 'bq-lab',
    queueName: 'Lab — Blood Test',
    type: 'completed',
    title: 'Completed L-018',
    subtitle: 'Blood sample collected successfully',
    ticketNumber: 'L-018',
    timestamp: minutesAgo(5),
  },
  {
    id: 'ba-3',
    queueId: 'bq-general-opd',
    queueName: 'General OPD',
    type: 'skipped',
    title: 'Skipped A-041',
    subtitle: 'Customer did not respond after two calls',
    ticketNumber: 'A-041',
    timestamp: minutesAgo(8),
  },
  {
    id: 'ba-4',
    queueId: 'bq-cardio',
    queueName: 'Cardiology',
    type: 'paused',
    title: 'Paused Queue',
    subtitle: 'Cardiology queue paused for staff break',
    timestamp: minutesAgo(12),
  },
  {
    id: 'ba-5',
    queueId: 'bq-pharmacy',
    queueName: 'Pharmacy Counter',
    type: 'walk_in',
    title: 'Walk-in P-063',
    subtitle: 'Maryam Javed added at Pharmacy Counter',
    ticketNumber: 'P-063',
    timestamp: minutesAgo(15),
  },
  {
    id: 'ba-6',
    queueId: 'bq-lab',
    queueName: 'Lab — Blood Test',
    type: 'recalled',
    title: 'Recalled L-017',
    subtitle: 'Customer returned after missing the first call',
    ticketNumber: 'L-017',
    timestamp: minutesAgo(18),
  },
  {
    id: 'ba-7',
    queueId: 'bq-general-opd',
    queueName: 'General OPD',
    type: 'cancelled',
    title: 'Cancelled A-039',
    subtitle: 'Ticket cancelled at customer request',
    ticketNumber: 'A-039',
    timestamp: minutesAgo(24),
  },
  {
    id: 'ba-8',
    queueId: 'bq-pharmacy',
    queueName: 'Pharmacy Counter',
    type: 'resumed',
    title: 'Resumed Queue',
    subtitle: 'Pharmacy Counter is accepting customers again',
    timestamp: minutesAgo(30),
  },
  {
    id: 'ba-9',
    queueId: 'bq-cardio',
    queueName: 'Cardiology',
    type: 'completed',
    title: 'Completed C-008',
    subtitle: 'Consultation finished — Counter 02',
    ticketNumber: 'C-008',
    timestamp: minutesAgo(36),
  },
  {
    id: 'ba-10',
    queueId: 'bq-general-opd',
    queueName: 'General OPD',
    type: 'called',
    title: 'Called A-040',
    subtitle: 'Now serving at Counter 01',
    ticketNumber: 'A-040',
    timestamp: minutesAgo(42),
  },
];

export function getActivityByQueueId(
  queueId: string,
  items: BusinessActivityItem[] = MOCK_BUSINESS_ACTIVITY,
): BusinessActivityItem[] {
  return items.filter((item) => item.queueId === queueId);
}

export function getRecentActivity(
  limit = 20,
  items: BusinessActivityItem[] = MOCK_BUSINESS_ACTIVITY,
): BusinessActivityItem[] {
  return [...items]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
