import type {
  NotificationCreateInput,
  NotificationListParams,
  NotificationRepository,
} from '@/domain/repositories';
import type { AppNotification, NotificationCategory } from '@/types/profile';
import { categoryForNotificationType } from '@/domain/models/notification';
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

  async getNotifications(params?: NotificationListParams) {
    const limit = params?.limit ?? 40;
    const offset = params?.offset ?? 0;
    return this.notifications.slice(offset, offset + limit).map((n) => ({
      ...n,
    }));
  }

  async list(
    _userId?: string,
    params?: NotificationListParams,
  ): Promise<AppNotification[]> {
    return this.getNotifications(params);
  }

  async getNotificationById(id: string) {
    return this.getById(id);
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

  async markAsRead(id: string): Promise<AppNotification | void> {
    const readAt = new Date().toISOString();
    this.notifications = this.notifications.map((n) =>
      n.id === id
        ? { ...n, read: true, isRead: true, readAt }
        : n,
    );
    return this.notifications.find((n) => n.id === id);
  }

  async markAllAsRead(_userId?: string): Promise<void> {
    const readAt = new Date().toISOString();
    this.notifications = this.notifications.map((n) => ({
      ...n,
      read: true,
      isRead: true,
      readAt,
    }));
  }

  async deleteNotification(id: string): Promise<void> {
    return this.delete(id);
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
    const message = input.message || input.description || '';
    const notification: AppNotification = {
      id: `n-${Date.now()}`,
      userId: input.userId,
      title: input.title,
      message,
      description: message,
      type: input.type,
      category: input.category ?? categoryForNotificationType(input.type),
      createdAt: new Date().toISOString(),
      read: false,
      isRead: false,
      ticketId: input.ticketId ?? null,
      queueId: input.queueId ?? null,
      organizationId: input.organizationId ?? null,
      readAt: null,
      eventKey: input.eventKey ?? null,
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
