import type { AppNotification, NotificationCategory } from '@/types/profile';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface NotificationCreateInput {
  userId: string;
  title: string;
  description: string;
  type: AppNotification['type'];
  category: NotificationCategory;
}

export interface NotificationRepository {
  list(userId?: string): Promise<AppNotification[]>;
  getById(id: string): Promise<AppNotification | null>;
  listByCategory(
    category: NotificationCategory | 'all',
    notifications?: AppNotification[],
  ): Promise<AppNotification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId?: string): Promise<void>;
  delete(id: string): Promise<void>;
  clearAll(userId?: string): Promise<void>;
  getUnreadCount(notifications?: AppNotification[]): Promise<number>;
  create(input: NotificationCreateInput): Promise<AppNotification>;
  subscribe(
    userId: string,
    callback: SubscribeCallback<AppNotification[]>,
  ): Unsubscribe;
}
