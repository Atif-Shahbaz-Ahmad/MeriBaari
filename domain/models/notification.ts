export type NotificationCategory = 'queue' | 'reminders' | 'system' | 'promotions';

/**
 * Strongly typed notification kinds (Prompt 4.7).
 * Stored as `notifications.type` in Supabase.
 */
export type NotificationType =
  | 'QUEUE_JOINED'
  | 'TICKET_CALLED'
  | 'TICKET_SERVING'
  | 'TICKET_SERVED'
  | 'TICKET_SKIPPED'
  | 'QUEUE_PAUSED'
  | 'QUEUE_RESUMED'
  | 'QUEUE_CLOSED'
  | 'QUEUE_TURN_APPROACHING'
  | 'QUEUE_CANCELLED'
  | 'CUSTOMER_JOINED'
  | 'SUBSCRIPTION_PAYMENT_SUBMITTED'
  | 'SUBSCRIPTION_APPROVED'
  | 'SUBSCRIPTION_REJECTED'
  | 'SYSTEM';

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
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
  'CUSTOMER_JOINED',
  'SUBSCRIPTION_PAYMENT_SUBMITTED',
  'SUBSCRIPTION_APPROVED',
  'SUBSCRIPTION_REJECTED',
  'SYSTEM',
] as const;

/**
 * Canonical notification entity — maps to `notifications` table.
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  /** Message body (DB column: description). */
  message: string;
  ticketId: string | null;
  queueId: string | null;
  organizationId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  /** Idempotency key from server inserts. */
  eventKey?: string | null;
  /** App grouping used by notification filters. */
  category: NotificationCategory;
}

/** Alias matching existing UI type name. */
export type AppNotification = Notification & {
  /** @deprecated Prefer `message` — kept for NotificationCard. */
  description: string;
  /** @deprecated Prefer `isRead` — kept for existing UI field `read`. */
  read: boolean;
};

/** Future channel preferences (UI not required yet). */
export interface NotificationPreferences {
  userId: string;
  inApp: boolean;
  push: boolean;
  email: boolean;
  whatsapp: boolean;
  updatedAt: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  'userId' | 'updatedAt'
> = {
  inApp: true,
  push: false,
  email: false,
  whatsapp: false,
};

export function categoryForNotificationType(
  type: NotificationType,
): NotificationCategory {
  switch (type) {
    case 'QUEUE_TURN_APPROACHING':
      return 'reminders';
    case 'SYSTEM':
    case 'SUBSCRIPTION_PAYMENT_SUBMITTED':
    case 'SUBSCRIPTION_APPROVED':
    case 'SUBSCRIPTION_REJECTED':
      return 'system';
    case 'QUEUE_JOINED':
    case 'TICKET_CALLED':
    case 'TICKET_SERVING':
    case 'TICKET_SERVED':
    case 'TICKET_SKIPPED':
    case 'QUEUE_PAUSED':
    case 'QUEUE_RESUMED':
    case 'QUEUE_CLOSED':
    case 'QUEUE_CANCELLED':
    case 'CUSTOMER_JOINED':
      return 'queue';
    default:
      return 'system';
  }
}

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}
