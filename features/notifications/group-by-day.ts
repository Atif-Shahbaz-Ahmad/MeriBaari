import type { AppNotification, NotificationCategory } from '@/types';

export function filterNotificationsByCategory(
  notifications: AppNotification[],
  category: NotificationCategory | 'all',
): AppNotification[] {
  if (category === 'all') return notifications;
  return notifications.filter((n) => n.category === category);
}

export function groupNotificationsByDay(notifications: AppNotification[]) {
  const sorted = [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const groups: { title: string; data: AppNotification[] }[] = [];
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const item of sorted) {
    const day = startOfDay(new Date(item.createdAt));
    if (day.getTime() === today.getTime()) {
      buckets.Today.push(item);
    } else if (day.getTime() === yesterday.getTime()) {
      buckets.Yesterday.push(item);
    } else {
      buckets.Earlier.push(item);
    }
  }

  for (const title of ['Today', 'Yesterday', 'Earlier'] as const) {
    if (buckets[title].length > 0) {
      groups.push({ title, data: buckets[title] });
    }
  }

  return groups;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
