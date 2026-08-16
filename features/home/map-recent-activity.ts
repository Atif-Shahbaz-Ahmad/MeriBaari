import type { ActivityItem, AppNotification, NotificationType } from '@/types';

const CUSTOMER_ACTIVITY_TYPES = new Set<NotificationType>([
  'QUEUE_JOINED',
  'TICKET_CALLED',
  'TICKET_SERVING',
  'TICKET_SERVED',
  'TICKET_SKIPPED',
  'QUEUE_PAUSED',
  'QUEUE_RESUMED',
  'QUEUE_CLOSED',
  'QUEUE_TURN_APPROACHING',
  'QUEUE_CANCELLED',
  'SYSTEM',
]);

const TYPE_MAP: Record<NotificationType, ActivityItem['type']> = {
  QUEUE_JOINED: 'joined',
  TICKET_CALLED: 'called',
  TICKET_SERVING: 'serving',
  TICKET_SERVED: 'completed',
  TICKET_SKIPPED: 'skipped',
  QUEUE_PAUSED: 'paused',
  QUEUE_RESUMED: 'resumed',
  QUEUE_CLOSED: 'closed',
  QUEUE_TURN_APPROACHING: 'reminder',
  QUEUE_CANCELLED: 'cancelled',
  CUSTOMER_JOINED: 'joined',
  SUBSCRIPTION_PAYMENT_SUBMITTED: 'reminder',
  SUBSCRIPTION_APPROVED: 'completed',
  SUBSCRIPTION_REJECTED: 'cancelled',
  SYSTEM: 'reminder',
};

export function isCustomerRecentActivity(
  notification: AppNotification,
): boolean {
  return CUSTOMER_ACTIVITY_TYPES.has(notification.type);
}

export function mapNotificationToActivityItem(
  notification: AppNotification,
): ActivityItem {
  return {
    id: notification.id,
    title: notification.title,
    subtitle: notification.message || notification.description,
    timestamp: notification.createdAt,
    type: TYPE_MAP[notification.type] ?? 'reminder',
  };
}
