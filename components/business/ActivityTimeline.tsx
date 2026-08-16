import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CheckCircle2,
  Megaphone,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  SkipForward,
  UserPlus,
  XCircle,
} from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getActivityMeta } from '@/features/business/status';
import { useTheme } from '@/hooks/use-theme';
import type { BusinessActivityItem, BusinessActivityType } from '@/types';
import { formatClockTime, formatRelativeTime } from '@/utils/formatting';

interface ActivityTimelineProps {
  items: BusinessActivityItem[];
  title?: string;
}

function ActivityIcon({ type, color }: { type: BusinessActivityType; color: string }) {
  const props = { size: 16, color, strokeWidth: 2.25 } as const;
  switch (type) {
    case 'called':
      return <Megaphone {...props} />;
    case 'skipped':
      return <SkipForward {...props} />;
    case 'completed':
      return <CheckCircle2 {...props} />;
    case 'cancelled':
      return <XCircle {...props} />;
    case 'recalled':
      return <RotateCcw {...props} />;
    case 'paused':
      return <PauseCircle {...props} />;
    case 'resumed':
      return <PlayCircle {...props} />;
    case 'walk_in':
      return <UserPlus {...props} />;
    default:
      return <Megaphone {...props} />;
  }
}

export function ActivityTimeline({ items, title = 'Recent activity' }: ActivityTimelineProps) {
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.empty, { color: theme.textMuted }]}>No recent activity yet.</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <View style={styles.list}>
        {items.map((item, index) => {
          const meta = getActivityMeta(item.type, theme.tints);
          return (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(70 + index * 45).duration(350)}
              style={styles.row}
            >
              <View style={styles.rail}>
                <View style={[styles.iconWrap, { backgroundColor: meta.background }]}>
                  <ActivityIcon type={item.type} color={meta.color} />
                </View>
                {index < items.length - 1 ? (
                  <View style={[styles.line, { backgroundColor: theme.border }]} />
                ) : null}
              </View>
              <View style={styles.content}>
                <View style={styles.top}>
                  <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.time, { color: theme.textMuted }]}>
                    {formatClockTime(item.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.subtitle}
                </Text>
                <Text style={[styles.relative, { color: theme.textMuted }]}>
                  {formatRelativeTime(item.timestamp)}
                  {item.queueName ? ` · ${item.queueName}` : ''}
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  title: {
    ...Typography.h3,
  },
  empty: {
    ...Typography.body,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: 72,
  },
  rail: {
    width: 36,
    alignItems: 'center',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.md,
    gap: 2,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  itemTitle: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  time: {
    ...Typography.caption,
  },
  subtitle: {
    ...Typography.caption,
  },
  relative: {
    ...Typography.caption,
    marginTop: 2,
  },
});
