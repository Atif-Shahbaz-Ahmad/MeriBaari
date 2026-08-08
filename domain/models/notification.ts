export type NotificationCategory = 'queue' | 'reminders' | 'system' | 'promotions';

export type NotificationType =
  | 'turn_soon'
  | 'turn_next'
  | 'queue_delayed'
  | 'queue_completed'
  | 'counter_changed'
  | 'queue_cancelled'
  | 'org_nearby'
  | 'joined'
  | 'reminder'
  | 'promo';

/**
 * Canonical notification entity — maps to `notifications` table.
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;

  /** App grouping used by notification filters. */
  category: NotificationCategory;
}

/** Alias matching existing UI type name. */
export type AppNotification = Notification & {
  /** @deprecated Prefer `isRead` — kept for existing store/UI field `read`. */
  read: boolean;
};
