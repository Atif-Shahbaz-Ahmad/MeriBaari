import type { NotificationRepository } from '@/domain/repositories';
import type { AppNotification, NotificationCategory } from '@/types/profile';
import { groupNotificationsByDay } from '@/mock/notifications';

export class NotificationService {
  constructor(private readonly notifications: NotificationRepository) {}

  list(userId?: string) {
    return this.notifications.list(userId);
  }

  listByCategory(
    category: NotificationCategory | 'all',
    notifications?: AppNotification[],
  ) {
    return this.notifications.listByCategory(category, notifications);
  }

  markAsRead(id: string) {
    return this.notifications.markAsRead(id);
  }

  markAllAsRead(userId?: string) {
    return this.notifications.markAllAsRead(userId);
  }

  delete(id: string) {
    return this.notifications.delete(id);
  }

  clearAll(userId?: string) {
    return this.notifications.clearAll(userId);
  }

  getUnreadCount(notifications?: AppNotification[]) {
    return this.notifications.getUnreadCount(notifications);
  }

  groupByDay(notifications: AppNotification[]) {
    return groupNotificationsByDay(notifications);
  }
}
