import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getContainer } from '@/data';
import type { AppNotification } from '@/types';
import { mapNotificationRow } from '@/data/supabase/mappers-notification';
import { notificationQueryKeys } from '@/features/notifications/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { NotificationRow } from '@/supabase/types';

const PAGE_SIZE = 40;

export function useNotifications(options?: { limit?: number; offset?: number }) {
  const session = useAuthStore((s) => s.session);
  const limit = options?.limit ?? PAGE_SIZE;
  const offset = options?.offset ?? 0;

  return useQuery({
    queryKey: notificationQueryKeys.list({ limit, offset }),
    queryFn: () =>
      getContainer().notificationService.getNotifications({ limit, offset }),
    enabled: Boolean(session),
  });
}

export function useUnreadNotificationCount() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: () => getContainer().notificationService.getUnreadCount(),
    enabled: Boolean(session),
  });
}

export function useNotification(id: string | undefined) {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: notificationQueryKeys.detail(id ?? ''),
    queryFn: () =>
      getContainer().notificationService.getNotificationById(id!),
    enabled: Boolean(session) && Boolean(id),
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      getContainer().notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });
      const previousLists = queryClient.getQueriesData<AppNotification[]>({
        queryKey: notificationQueryKeys.lists,
      });
      const previousCount = queryClient.getQueryData<number>(
        notificationQueryKeys.unreadCount,
      );

      const wasUnread = previousLists.some(([, list]) =>
        list?.some((n) => n.id === id && !(n.isRead ?? n.read)),
      );

      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: notificationQueryKeys.lists },
        (old) =>
          old?.map((n) =>
            n.id === id
              ? {
                  ...n,
                  read: true,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : n,
          ),
      );

      if (wasUnread && typeof previousCount === 'number' && previousCount > 0) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount,
          Math.max(0, previousCount - 1),
        );
      }

      return { previousLists, previousCount };
    },
    onError: (_err, _id, context) => {
      if (!context) return;
      for (const [key, data] of context.previousLists) {
        queryClient.setQueryData(key, data);
      }
      if (typeof context.previousCount === 'number') {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount,
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getContainer().notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });
      const previousLists = queryClient.getQueriesData<AppNotification[]>({
        queryKey: notificationQueryKeys.lists,
      });
      const previousCount = queryClient.getQueryData<number>(
        notificationQueryKeys.unreadCount,
      );
      const readAt = new Date().toISOString();

      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: notificationQueryKeys.lists },
        (old) =>
          old?.map((n) => ({
            ...n,
            read: true,
            isRead: true,
            readAt: n.readAt ?? readAt,
          })),
      );
      queryClient.setQueryData(notificationQueryKeys.unreadCount, 0);

      return { previousLists, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, data] of context.previousLists) {
        queryClient.setQueryData(key, data);
      }
      if (typeof context.previousCount === 'number') {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount,
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      getContainer().notificationService.deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });
      const previousLists = queryClient.getQueriesData<AppNotification[]>({
        queryKey: notificationQueryKeys.lists,
      });
      const previousCount = queryClient.getQueryData<number>(
        notificationQueryKeys.unreadCount,
      );

      let removedUnread = false;
      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: notificationQueryKeys.lists },
        (old) => {
          const target = old?.find((n) => n.id === id);
          if (target && !(target.isRead ?? target.read)) {
            removedUnread = true;
          }
          return old?.filter((n) => n.id !== id);
        },
      );

      if (
        removedUnread &&
        typeof previousCount === 'number' &&
        previousCount > 0
      ) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount,
          Math.max(0, previousCount - 1),
        );
      }

      return { previousLists, previousCount };
    },
    onError: (_err, _id, context) => {
      if (!context) return;
      for (const [key, data] of context.previousLists) {
        queryClient.setQueryData(key, data);
      }
      if (typeof context.previousCount === 'number') {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount,
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getContainer().notificationService.clearAll(),
    onSuccess: () => {
      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: notificationQueryKeys.lists },
        () => [],
      );
      queryClient.setQueryData(notificationQueryKeys.unreadCount, 0);
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

/**
 * App-lifetime subscription for the authenticated user's notifications.
 * Starts on login / customer app entry; cleaned up on logout via RealtimeService.unsubscribeAll.
 */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  useEffect(() => {
    if (!userId) return;

    const realtime = getContainer().realtimeService;

    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    };

    const unsub = realtime.subscribeToNotifications(userId, (payload) => {
      try {
        if (payload.eventType === 'INSERT' && payload.new) {
          const mapped = mapNotificationRow(payload.new as NotificationRow);
          queryClient.setQueriesData<AppNotification[]>(
            { queryKey: notificationQueryKeys.lists },
            (old) => {
              if (!old) return [mapped];
              if (old.some((n) => n.id === mapped.id)) return old;
              return [mapped, ...old];
            },
          );
          if (!mapped.isRead) {
            const current = queryClient.getQueryData<number>(
              notificationQueryKeys.unreadCount,
            );
            queryClient.setQueryData(
              notificationQueryKeys.unreadCount,
              (current ?? 0) + 1,
            );
          }
          return;
        }

        if (payload.eventType === 'UPDATE' && payload.new) {
          const mapped = mapNotificationRow(payload.new as NotificationRow);
          queryClient.setQueriesData<AppNotification[]>(
            { queryKey: notificationQueryKeys.lists },
            (old) =>
              old?.map((n) => (n.id === mapped.id ? mapped : n)) ?? [mapped],
          );
          void queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.unreadCount,
          });
          return;
        }

        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as { id?: string } | null;
          const id = oldRow?.id;
          if (id) {
            queryClient.setQueriesData<AppNotification[]>(
              { queryKey: notificationQueryKeys.lists },
              (old) => old?.filter((n) => n.id !== id),
            );
          }
          void queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.unreadCount,
          });
          return;
        }

        invalidate();
      } catch (error) {
        if (__DEV__) {
          console.warn('[notifications] realtime handler error', error);
        }
        invalidate();
      }
    });

    const unsubReconnect = realtime.onReconnect(invalidate);

    return () => {
      unsub();
      unsubReconnect();
    };
  }, [userId, queryClient]);
}
