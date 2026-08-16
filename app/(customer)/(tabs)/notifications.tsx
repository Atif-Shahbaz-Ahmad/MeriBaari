import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCheck, Trash2 } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { FilterTabs } from '@/components/tickets/FilterTabs';
import { NotificationCard } from '@/components/profile/NotificationCard';
import { SectionTitle } from '@/components/profile/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/features/notifications/hooks/use-notifications';
import { navigateFromNotification } from '@/features/notifications/navigation';
import { groupNotificationsByDay } from '@/features/notifications/group-by-day';
import type { NotificationCategory } from '@/types';

type NotifTab = NotificationCategory | 'all';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const [tab, setTab] = useState<NotifTab>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !(n.isRead ?? n.read)).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    if (tab === 'all') return notifications;
    return notifications.filter((n) => n.category === tab);
  }, [notifications, tab]);

  const groups = useMemo(
    () => groupNotificationsByDay(filtered),
    [filtered],
  );

  const inboxBusy =
    markAllAsRead.isPending ||
    clearAll.isPending ||
    markAsRead.isPending ||
    deleteNotification.isPending;

  const tabs = [
    { key: 'all' as const, label: t('notifications.tabAll'), count: notifications.length },
    {
      key: 'queue' as const,
      label: t('notifications.tabQueue'),
      count: notifications.filter((n) => n.category === 'queue').length,
    },
    {
      key: 'reminders' as const,
      label: t('notifications.tabReminders'),
      count: notifications.filter((n) => n.category === 'reminders').length,
    },
    {
      key: 'system' as const,
      label: t('notifications.tabSystem'),
      count: notifications.filter((n) => n.category === 'system').length,
    },
    {
      key: 'promotions' as const,
      label: t('notifications.tabPromos'),
      count: notifications.filter((n) => n.category === 'promotions').length,
    },
  ];

  const runItemAction = (id: string, action: () => void) => {
    if (inboxBusy) return;
    setPendingId(id);
    action();
  };

  const onOpen = (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (!item || inboxBusy) return;
    if (!(item.isRead ?? item.read)) {
      setPendingId(id);
      markAsRead.mutate(id, {
        onSettled: () => setPendingId(null),
      });
    }
    navigateFromNotification(item);
  };

  const onLongPress = (id: string, title: string) => {
    if (inboxBusy) return;
    Alert.alert(title, t('notifications.chooseAction'), [
      {
        text: t('notifications.markAsRead'),
        onPress: () =>
          runItemAction(id, () =>
            markAsRead.mutate(id, { onSettled: () => setPendingId(null) }),
          ),
      },
      {
        text: t('notifications.delete'),
        style: 'destructive',
        onPress: () =>
          runItemAction(id, () =>
            deleteNotification.mutate(id, {
              onSettled: () => setPendingId(null),
            }),
          ),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const onClearAll = () => {
    if (clearAll.isPending || notifications.length === 0) return;
    Alert.alert(t('notifications.clearConfirmTitle'), t('notifications.clearConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('notifications.clearAll'),
        style: 'destructive',
        onPress: () => clearAll.mutate(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={4} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          title={t('notifications.loadError')}
          description={
            error instanceof Error
              ? error.message
              : t('notifications.loadErrorHint')
          }
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <SectionTitle
                title={t('notifications.title')}
                subtitle={
                  unreadCount > 0
                    ? unreadCount === 1
                      ? t('notifications.subtitleUnread', { count: unreadCount })
                      : t('notifications.subtitleUnread_plural', { count: unreadCount })
                    : t('notifications.subtitleEmpty')
                }
              />
            </View>
          </View>
          {notifications.length > 0 ? (
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  if (markAllAsRead.isPending || unreadCount === 0) return;
                  markAllAsRead.mutate();
                }}
                disabled={markAllAsRead.isPending || unreadCount === 0 || clearAll.isPending}
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: theme.tints.primary.bg,
                    opacity:
                      markAllAsRead.isPending || unreadCount === 0 || clearAll.isPending
                        ? 0.55
                        : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.markAllA11y')}
                accessibilityState={{
                  disabled: markAllAsRead.isPending || unreadCount === 0,
                  busy: markAllAsRead.isPending,
                }}
                hitSlop={8}
              >
                {markAllAsRead.isPending ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <CheckCheck size={16} color={Colors.primary} />
                )}
                <Text style={[styles.actionText, { color: Colors.primary }]}>
                  {t('notifications.markAllRead')}
                </Text>
              </Pressable>
              <Pressable
                onPress={onClearAll}
                disabled={clearAll.isPending || markAllAsRead.isPending}
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: theme.tints.error.bg,
                    opacity: clearAll.isPending || markAllAsRead.isPending ? 0.55 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.clearAllA11y')}
                accessibilityState={{
                  disabled: clearAll.isPending,
                  busy: clearAll.isPending,
                }}
                hitSlop={8}
              >
                {clearAll.isPending ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Trash2 size={16} color={Colors.error} />
                )}
                <Text style={[styles.actionText, { color: Colors.error }]}>
                  {t('notifications.clearAll')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <FilterTabs tabs={tabs} activeKey={tab} onChange={setTab} />
        </Animated.View>

        {groups.length === 0 ? (
          <EmptyState
            preset="notifications"
            title={
              notifications.length > 0
                ? t('notifications.emptyFilteredTitle')
                : t('notifications.emptyTitle')
            }
            description={
              notifications.length > 0
                ? t('notifications.emptyFilteredDescription')
                : t('notifications.emptyDescription')
            }
          />
        ) : (
          groups.map((group, groupIndex) => (
            <Animated.View
              key={group.title}
              entering={FadeInDown.delay(80 * (groupIndex + 1)).duration(400)}
              style={styles.group}
            >
              <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{group.title}</Text>
              <View style={styles.stack}>
                {group.data.map((item, index) => (
                  <NotificationCard
                    key={item.id}
                    notification={item}
                    index={index}
                    disabled={inboxBusy}
                    loading={pendingId === item.id && (markAsRead.isPending || deleteNotification.isPending)}
                    onPress={() => onOpen(item.id)}
                    onLongPress={() => onLongPress(item.id, item.title)}
                  />
                ))}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionChip: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  actionText: {
    ...Typography.small,
  },
  group: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  groupTitle: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stack: {
    gap: Spacing.sm,
  },
});
