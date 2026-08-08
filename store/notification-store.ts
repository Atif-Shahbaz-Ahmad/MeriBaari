import { create } from 'zustand';

import { getContainer } from '@/data';
import type { AppNotification, NotificationCategory } from '@/types';

interface NotificationState {
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
  byCategory: (category: NotificationCategory | 'all') => AppNotification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: getContainer().mockNotificationRepository.getSeedNotifications(),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  byCategory: (category) => {
    const list = get().notifications;
    if (category === 'all') return list;
    return list.filter((n) => n.category === category);
  },
}));
