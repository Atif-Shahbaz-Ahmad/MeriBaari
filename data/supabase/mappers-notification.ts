import type {
  AppNotification,
  NotificationCategory,
  NotificationType,
} from '@/domain/models/notification';
import {
  categoryForNotificationType,
  isNotificationType,
} from '@/domain/models/notification';
import type { NotificationRow } from '@/supabase/types';

export function mapNotificationRow(row: NotificationRow): AppNotification {
  const type = normalizeNotificationType(row.type);
  const message = row.description ?? '';
  const isRead = Boolean(row.is_read);

  return {
    id: row.id,
    userId: row.user_id,
    type,
    title: row.title,
    message,
    description: message,
    ticketId: row.ticket_id ?? null,
    queueId: row.queue_id ?? null,
    organizationId: row.organization_id ?? null,
    isRead,
    read: isRead,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
    eventKey: row.event_key ?? null,
    category: categoryForNotificationType(type),
  };
}

export function normalizeNotificationType(value: unknown): NotificationType {
  if (isNotificationType(value)) return value;
  return 'SYSTEM';
}

export function deriveCategory(
  type: NotificationType,
): NotificationCategory {
  return categoryForNotificationType(type);
}
