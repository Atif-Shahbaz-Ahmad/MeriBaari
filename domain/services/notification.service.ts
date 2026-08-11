import type {
  AppNotification,
  NotificationCategory,
  NotificationPreferences,
} from '@/domain/models/notification';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/domain/models/notification';
import type {
  NotificationCreateInput,
  NotificationListParams,
  NotificationRepository,
} from '@/domain/repositories';
import {
  createDefaultNotificationChannels,
  type NotificationChannel,
  type OutboundNotification,
} from '@/domain/notifications/channels';
import type { NotificationTemplate } from '@/domain/notifications/templates';
import { groupNotificationsByDay } from '@/features/notifications/group-by-day';

const DEFAULT_PAGE_SIZE = 40;

export class NotificationService {
  private readonly channels: NotificationChannel[];

  constructor(
    private readonly notifications: NotificationRepository,
    channels?: NotificationChannel[],
  ) {
    this.channels = channels ?? createDefaultNotificationChannels();
  }

  getNotifications(params?: NotificationListParams) {
    return this.notifications.getNotifications({
      limit: params?.limit ?? DEFAULT_PAGE_SIZE,
      offset: params?.offset ?? 0,
    });
  }

  list(userId?: string, params?: NotificationListParams) {
    return this.notifications.list(userId, {
      limit: params?.limit ?? DEFAULT_PAGE_SIZE,
      offset: params?.offset ?? 0,
    });
  }

  getNotificationById(id: string) {
    return this.notifications.getNotificationById(id);
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

  deleteNotification(id: string) {
    return this.notifications.deleteNotification(id);
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

  /**
   * Fan-out helper for future channels. Queue events insert via Postgres;
   * this path is for local/system notifications and future outbound delivery.
   */
  async deliverThroughChannels(
    userId: string,
    template: NotificationTemplate,
    preferences: NotificationPreferences = {
      userId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      updatedAt: new Date().toISOString(),
    },
  ): Promise<void> {
    const outbound: OutboundNotification = { ...template, userId };
    await Promise.all(
      this.channels
        .filter((channel) => channel.isEnabled(preferences))
        .map(async (channel) => {
          try {
            await channel.deliver(outbound);
          } catch (error) {
            if (__DEV__) {
              console.warn(
                `[notifications] ${channel.kind} deliver failed`,
                error,
              );
            }
          }
        }),
    );
  }

  /** Mock / restricted create — queue notifications must come from RPCs. */
  create(input: NotificationCreateInput) {
    return this.notifications.create(input);
  }

  getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      updatedAt: new Date().toISOString(),
    };
  }
}
