import type { AppNotification, NotificationCategory } from '@/types';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);
const daysAgo = (d: number) => minutesAgo(d * 24 * 60);

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    userId: 'mock-user',
    title: 'Your Turn Is Near',
    message: 'You are almost next. Please be ready.',
    description: 'You are almost next. Please be ready.',
    type: 'QUEUE_TURN_APPROACHING',
    category: 'reminders',
    createdAt: minutesAgo(8),
    read: false,
    isRead: false,
    ticketId: null,
    queueId: null,
    organizationId: null,
    readAt: null,
  },
  {
    id: 'n-2',
    userId: 'mock-user',
    title: 'Your Turn',
    message: 'Your ticket B-058 has been called.',
    description: 'Your ticket B-058 has been called.',
    type: 'TICKET_CALLED',
    category: 'queue',
    createdAt: minutesAgo(22),
    read: false,
    isRead: false,
    ticketId: null,
    queueId: null,
    organizationId: null,
    readAt: null,
  },
  {
    id: 'n-3',
    userId: 'mock-user',
    title: 'Queue Paused',
    message: 'The queue at MediCare Clinic has been temporarily paused.',
    description: 'The queue at MediCare Clinic has been temporarily paused.',
    type: 'QUEUE_PAUSED',
    category: 'queue',
    createdAt: hoursAgo(2),
    read: false,
    isRead: false,
    ticketId: null,
    queueId: null,
    organizationId: null,
    readAt: null,
  },
  {
    id: 'n-4',
    userId: 'mock-user',
    title: 'Service Completed',
    message: 'Your service at MediCare Clinic has been completed.',
    description: 'Your service at MediCare Clinic has been completed.',
    type: 'TICKET_SERVED',
    category: 'queue',
    createdAt: hoursAgo(5),
    read: true,
    isRead: true,
    ticketId: null,
    queueId: null,
    organizationId: null,
    readAt: hoursAgo(4),
  },
  {
    id: 'n-5',
    userId: 'mock-user',
    title: 'Queue Joined',
    message: 'You joined the queue at City Hospital.',
    description: 'You joined the queue at City Hospital.',
    type: 'QUEUE_JOINED',
    category: 'queue',
    createdAt: hoursAgo(6),
    read: true,
    isRead: true,
    ticketId: null,
    queueId: null,
    organizationId: null,
    readAt: hoursAgo(6),
  },
  {
    id: 'n-6',
    userId: 'mock-user',
    title: 'Queue Cancelled',
    message: 'Your active ticket is no longer valid because the queue closed.',
    description: 'Your active ticket is no longer valid because the queue closed.',
    type: 'QUEUE_CANCELLED',
    category: 'queue',
    createdAt: daysAgo(1),
    read: true,
    isRead: true,
    ticketId: null,
    queueId: null,
    organizationId: null,
    readAt: daysAgo(1),
  },
  {
    id: 'n-7',
    userId: 'mock-user',
    title: 'System update',
    message: 'Welcome to MeriBaari notifications.',
    description: 'Welcome to MeriBaari notifications.',
    type: 'SYSTEM',
    category: 'system',
    createdAt: daysAgo(3),
    read: true,
    isRead: true,
    ticketId: null,
    queueId: null,
    organizationId: null,
    readAt: daysAgo(3),
  },
];

export function getUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !(n.isRead ?? n.read)).length;
}

export function filterNotificationsByCategory(
  notifications: AppNotification[],
  category: NotificationCategory | 'all',
): AppNotification[] {
  if (category === 'all') return notifications;
  return notifications.filter((n) => n.category === category);
}

export function groupNotificationsByDay(notifications: AppNotification[]) {
  const sorted = [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const groups: { title: string; data: AppNotification[] }[] = [];
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const item of sorted) {
    const day = startOfDay(new Date(item.createdAt));
    if (day.getTime() === today.getTime()) {
      buckets.Today.push(item);
    } else if (day.getTime() === yesterday.getTime()) {
      buckets.Yesterday.push(item);
    } else {
      buckets.Earlier.push(item);
    }
  }

  for (const title of ['Today', 'Yesterday', 'Earlier'] as const) {
    if (buckets[title].length > 0) {
      groups.push({ title, data: buckets[title] });
    }
  }

  return groups;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
