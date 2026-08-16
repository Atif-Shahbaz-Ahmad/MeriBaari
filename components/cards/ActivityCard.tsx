import { StyleSheet, Text, View } from 'react-native';
import {
  BellRing,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Ticket,
  Timer,
  XCircle,
} from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/utils/formatting';
import type { ActivityItem } from '@/types';

interface ActivityCardProps {
  item: ActivityItem;
}

export function ActivityCard({ item }: ActivityCardProps) {
  const theme = useTheme();
  const typeStyle = {
    joined: { icon: Ticket, color: theme.tints.primary.fg, bg: theme.tints.primary.bg },
    called: { icon: BellRing, color: theme.tints.primary.fg, bg: theme.tints.primary.bg },
    serving: { icon: Timer, color: theme.tints.accent.fg, bg: theme.tints.accent.bg },
    completed: { icon: CheckCircle2, color: theme.tints.secondary.fg, bg: theme.tints.secondary.bg },
    skipped: { icon: XCircle, color: theme.tints.error.fg, bg: theme.tints.error.bg },
    paused: { icon: PauseCircle, color: theme.tints.accent.fg, bg: theme.tints.accent.bg },
    resumed: { icon: PlayCircle, color: theme.tints.secondary.fg, bg: theme.tints.secondary.bg },
    closed: { icon: XCircle, color: theme.tints.error.fg, bg: theme.tints.error.bg },
    reminder: { icon: BellRing, color: theme.tints.accent.fg, bg: theme.tints.accent.bg },
    cancelled: { icon: XCircle, color: theme.tints.error.fg, bg: theme.tints.error.bg },
  } as const;
  const config = typeStyle[item.type];
  const Icon = config.icon;

  return (
    <Card elevated={false} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Icon size={18} color={config.color} strokeWidth={2} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
      </View>
      <Text style={[styles.time, { color: theme.textMuted }]}>
        {formatRelativeTime(item.timestamp)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.bodyMedium,
  },
  subtitle: {
    ...Typography.caption,
  },
  time: {
    ...Typography.caption,
  },
});
