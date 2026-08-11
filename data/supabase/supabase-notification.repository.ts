import type {
  NotificationCreateInput,
  NotificationListParams,
  NotificationRepository,
} from '@/domain/repositories';
import type { AppNotification, NotificationCategory } from '@/types/profile';
import { categoryForNotificationType } from '@/domain/models/notification';
import { filterNotificationsByCategory } from '@/features/notifications/group-by-day';
import { AuthError } from '@/domain/errors/auth-error';
import { mapNotificationRow } from '@/data/supabase/mappers-notification';
import { requireSupabase } from '@/lib/supabase';
import type { NotificationRow } from '@/supabase/types';
import { noopSubscribe } from '@/data/mock/noop-subscribe';

const DEFAULT_LIMIT = 40;

export class SupabaseNotificationRepository implements NotificationRepository {
  async getNotifications(
    params?: NotificationListParams,
  ): Promise<AppNotification[]> {
    return this.list(undefined, params);
  }

  async list(
    _userId?: string,
    params?: NotificationListParams,
  ): Promise<AppNotification[]> {
    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    const limit = params?.limit ?? DEFAULT_LIMIT;
    const offset = params?.offset ?? 0;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message || 'Failed to load notifications.');
    }

    return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
  }

  async getNotificationById(id: string): Promise<AppNotification | null> {
    return this.getById(id);
  }

  async getById(id: string): Promise<AppNotification | null> {
    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load notification.');
    }
    if (!data) return null;
    return mapNotificationRow(data as NotificationRow);
  }

  async listByCategory(
    category: NotificationCategory | 'all',
    notifications?: AppNotification[],
  ): Promise<AppNotification[]> {
    const list = notifications ?? (await this.getNotifications());
    return filterNotificationsByCategory(list, category);
  }

  async markAsRead(id: string): Promise<AppNotification | void> {
    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    const readAt = new Date().toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: readAt })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to mark notification as read.');
    }
    if (!data) return;
    return mapNotificationRow(data as NotificationRow);
  }

  async markAllAsRead(_userId?: string): Promise<void> {
    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: readAt })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      throw new Error(error.message || 'Failed to mark all as read.');
    }
  }

  async deleteNotification(id: string): Promise<void> {
    return this.delete(id);
  }

  async delete(id: string): Promise<void> {
    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message || 'Failed to delete notification.');
    }
  }

  async clearAll(_userId?: string): Promise<void> {
    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message || 'Failed to clear notifications.');
    }
  }

  async getUnreadCount(
    notifications?: AppNotification[],
  ): Promise<number> {
    if (notifications) {
      return notifications.filter((n) => !(n.isRead ?? n.read)).length;
    }

    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      if (__DEV__) {
        console.warn('[notifications] unread count failed', error.message);
      }
      return 0;
    }

    return count ?? 0;
  }

  async create(input: NotificationCreateInput): Promise<AppNotification> {
    // Client inserts are blocked by RLS for security. Mock mode only.
    throw new Error(
      'Client notification creation is disabled. Queue notifications are created by secure database functions.',
    );
  }

  subscribe(userId: string, callback: (payload: AppNotification[]) => void) {
    return noopSubscribe(callback);
  }
}

/** @internal helper for optimistic UI */
export function buildLocalNotification(
  input: NotificationCreateInput & { id?: string },
): AppNotification {
  const message = input.message || input.description || '';
  const type = input.type;
  return {
    id: input.id ?? `local-${Date.now()}`,
    userId: input.userId,
    title: input.title,
    message,
    description: message,
    type,
    category: input.category ?? categoryForNotificationType(type),
    ticketId: input.ticketId ?? null,
    queueId: input.queueId ?? null,
    organizationId: input.organizationId ?? null,
    isRead: false,
    read: false,
    createdAt: new Date().toISOString(),
    readAt: null,
    eventKey: input.eventKey ?? null,
  };
}
