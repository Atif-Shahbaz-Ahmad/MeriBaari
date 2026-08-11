import type {
  AppNotification,
  NotificationCategory,
  NotificationType,
} from '@/types/profile';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface NotificationCreateInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  ticketId?: string | null;
  queueId?: string | null;
  organizationId?: string | null;
  eventKey?: string;
  /** @deprecated Prefer `message`. */
  description?: string;
  category?: NotificationCategory;
}

export interface NotificationListParams {
  limit?: number;
  offset?: number;
}

export interface NotificationRepository {
  list(
    userId?: string,
    params?: NotificationListParams,
  ): Promise<AppNotification[]>;
  getById(id: string): Promise<AppNotification | null>;
  getNotifications(
    params?: NotificationListParams,
  ): Promise<AppNotification[]>;
  getNotificationById(id: string): Promise<AppNotification | null>;
  listByCategory(
    category: NotificationCategory | 'all',
    notifications?: AppNotification[],
  ): Promise<AppNotification[]>;
  markAsRead(id: string): Promise<AppNotification | void>;
  markAllAsRead(userId?: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  clearAll(userId?: string): Promise<void>;
  getUnreadCount(notifications?: AppNotification[]): Promise<number>;
  /**
   * Client-side create is restricted by RLS for queue events.
   * Kept for system/local/mock usage only.
   */
  create(input: NotificationCreateInput): Promise<AppNotification>;
  subscribe(
    userId: string,
    callback: SubscribeCallback<AppNotification[]>,
  ): Unsubscribe;
}
