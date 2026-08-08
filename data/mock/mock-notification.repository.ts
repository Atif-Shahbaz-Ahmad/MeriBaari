import type {
  NotificationCreateInput,
  NotificationRepository,
} from '@/domain/repositories';
import type { AppNotification, NotificationCategory } from '@/types/profile';
import {
  filterNotificationsByCategory,
  getUnreadCount,
  MOCK_NOTIFICATIONS,
} from '@/mock/notifications';
import { noopSubscribe } from './noop-subscribe';

export class MockNotificationRepository implements NotificationRepository {
  private notifications: AppNotification[] = MOCK_NOTIFICATIONS.map((n) => ({
    ...n,
  }));

  async list(_userId?: string): Promise<AppNotification[]> {
    return this.notifications.map((n) => ({ ...n }));
  }

  async getById(id: string): Promise<AppNotification | null> {
    return this.notifications.find((n) => n.id === id) ?? null;
  }

  async listByCategory(
    category: NotificationCategory | 'all',
    notifications?: AppNotification[],
  ): Promise<AppNotification[]> {
    return filterNotificationsByCategory(
      notifications ?? this.notifications,
      category,
    );
  }

  async markAsRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
  }

  async markAllAsRead(_userId?: string): Promise<void> {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }

  async delete(id: string): Promise<void> {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  async clearAll(_userId?: string): Promise<void> {
    this.notifications = [];
  }

  async getUnreadCount(
    notifications?: AppNotification[],
  ): Promise<number> {
    return getUnreadCount(notifications ?? this.notifications);
  }

  async create(input: NotificationCreateInput): Promise<AppNotification> {
    const notification: AppNotification = {
      id: `n-${Date.now()}`,
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.notifications = [notification, ...this.notifications];
    return notification;
  }

  subscribe(userId: string, callback: (payload: AppNotification[]) => void) {
    return noopSubscribe(callback);
  }

  getSeedNotifications(): AppNotification[] {
    return this.notifications.map((n) => ({ ...n }));
  }
}
