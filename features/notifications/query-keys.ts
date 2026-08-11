export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: ['notifications', 'list'] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    ['notifications', 'list', params?.limit ?? 40, params?.offset ?? 0] as const,
  detail: (id: string) => ['notifications', 'detail', id] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};
