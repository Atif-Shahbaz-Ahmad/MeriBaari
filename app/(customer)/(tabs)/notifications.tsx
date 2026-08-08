import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCheck, Trash2 } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { FilterTabs } from '@/components/tickets/FilterTabs';
import { NotificationCard } from '@/components/profile/NotificationCard';
import { SectionTitle } from '@/components/profile/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import { useNotificationStore } from '@/store/notification-store';
import type { NotificationCategory } from '@/types';

type NotifTab = NotificationCategory | 'all';

export default function NotificationsScreen() {
  const theme = useTheme();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  const [tab, setTab] = useState<NotifTab>('all');

  const filtered = useMemo(
    () => dataAccess.filterNotificationsByCategory(notifications, tab),
    [notifications, tab],
  );
  const groups = useMemo(
    () => dataAccess.groupNotificationsByDay(filtered),
    [filtered],
  );

  const tabs = [
    { key: 'all' as const, label: 'All', count: notifications.length },
    {
      key: 'queue' as const,
      label: 'Queue',
      count: notifications.filter((n) => n.category === 'queue').length,
    },
    {
      key: 'reminders' as const,
      label: 'Reminders',
      count: notifications.filter((n) => n.category === 'reminders').length,
    },
    {
      key: 'system' as const,
      label: 'System',
      count: notifications.filter((n) => n.category === 'system').length,
    },
    {
      key: 'promotions' as const,
      label: 'Promos',
      count: notifications.filter((n) => n.category === 'promotions').length,
    },
  ];

  const onLongPress = (id: string, title: string) => {
    Alert.alert(title, 'Choose an action', [
      {
        text: 'Mark as read',
        onPress: () => markAsRead(id),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNotification(id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onClearAll = () => {
    Alert.alert('Clear all notifications?', 'This removes every notification from your inbox.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <SectionTitle
                title="Notifications"
                subtitle={
                  unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                    : 'Stay updated on your queues'
                }
              />
            </View>
          </View>
          {notifications.length > 0 ? (
            <View style={styles.actions}>
              <Pressable
                onPress={markAllAsRead}
                style={[styles.actionChip, { backgroundColor: Colors.primary50 }]}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
                hitSlop={8}
              >
                <CheckCheck size={16} color={Colors.primary} />
                <Text style={[styles.actionText, { color: Colors.primary }]}>Mark all read</Text>
              </Pressable>
              <Pressable
                onPress={onClearAll}
                style={[styles.actionChip, { backgroundColor: Colors.error50 }]}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
                hitSlop={8}
              >
                <Trash2 size={16} color={Colors.error} />
                <Text style={[styles.actionText, { color: Colors.error }]}>Clear all</Text>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <FilterTabs tabs={tabs} activeKey={tab} onChange={setTab} />
        </Animated.View>

        {groups.length === 0 ? (
          <EmptyState preset="notifications" />
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
                    onPress={() => markAsRead(item.id)}
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
