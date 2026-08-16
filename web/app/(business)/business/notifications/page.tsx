'use client';

import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/features/notifications/hooks/use-notifications';
import { useTranslation } from '@/hooks/use-translation';
import { formatRelativeTime } from '@/utils/formatting';
import { Button, Card, EmptyState, ErrorState, LoadingSkeleton } from '@web/components/ui';

export default function BusinessNotificationsPage() {
  const { t } = useTranslation();
  const list = useNotifications();
  const markOne = useMarkNotificationAsRead();
  const markAll = useMarkAllNotificationsAsRead();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('notifications.title')}</h1>
        <Button variant="ghost" onClick={() => void markAll.mutateAsync()}>
          {t('notifications.markAllRead')}
        </Button>
      </div>
      {list.isLoading ? (
        <LoadingSkeleton />
      ) : list.isError ? (
        <ErrorState title={t('notifications.loadError')} onRetry={() => void list.refetch()} />
      ) : list.data?.length ? (
        <ul className="space-y-2">
          {list.data.map((item) => {
            const unread = !(item.isRead ?? item.read);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    if (unread) void markOne.mutateAsync(item.id);
                  }}
                >
                  <Card className={unread ? 'border-primary/40' : undefined}>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-ink-secondary">
                      {item.message || item.description}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatRelativeTime(item.createdAt)} · {item.type}
                    </p>
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title={t('notifications.emptyTitle')}
          description={t('notifications.emptyDescription')}
        />
      )}
    </div>
  );
}
