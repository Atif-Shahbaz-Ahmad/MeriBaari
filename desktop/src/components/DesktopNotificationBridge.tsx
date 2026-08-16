import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useNotificationsRealtime } from '@/features/notifications/hooks/use-notifications';
import { notificationQueryKeys } from '@/features/notifications/query-keys';
import type { AppNotification } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { notifyDesktop } from '../lib/native-notifications';

export function DesktopNotificationBridge() {
  useNotificationsRealtime();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const seen = useRef(new Set<string>());
  const ready = useRef(false);

  useEffect(() => {
    if (!userId) {
      seen.current.clear();
      ready.current = false;
      return;
    }

    const markExisting = () => {
      const lists = queryClient.getQueriesData<AppNotification[]>({
        queryKey: notificationQueryKeys.lists,
      });
      for (const [, list] of lists) {
        for (const item of list ?? []) {
          seen.current.add(item.id);
        }
      }
      ready.current = true;
    };

    markExisting();
    const timer = window.setTimeout(markExisting, 1500);

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!ready.current) return;
      if (event.type !== 'updated') return;
      const lists = queryClient.getQueriesData<AppNotification[]>({
        queryKey: notificationQueryKeys.lists,
      });
      for (const [, list] of lists) {
        for (const item of list ?? []) {
          if (seen.current.has(item.id)) continue;
          seen.current.add(item.id);
          const unread = !(item.isRead ?? item.read);
          if (!unread) continue;
          void notifyDesktop(item.title, item.message || item.description || '');
        }
      }
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [userId, queryClient]);

  return null;
}
