import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { QueueStatus } from '@/types';

const STATUS_MAP: Record<
  QueueStatus | 'live' | 'waiting' | 'current',
  { label: string; background: string; color: string }
> = {
  live: { label: 'Live', background: Colors.secondary100, color: Colors.secondary600 },
  waiting: { label: 'Waiting', background: Colors.accent100, color: '#B45309' },
  current: { label: 'Current', background: Colors.secondary100, color: Colors.secondary600 },
  called: { label: 'Called', background: Colors.primary100, color: Colors.primary600 },
  serving: { label: 'Serving', background: Colors.secondary100, color: Colors.secondary600 },
  completed: { label: 'Completed', background: Colors.secondary50, color: Colors.secondary600 },
  cancelled: { label: 'Cancelled', background: Colors.error100, color: Colors.error },
};

interface StatusBadgeProps {
  status: QueueStatus | 'live' | 'waiting' | 'current';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_MAP[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.background }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{label ?? config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...Typography.caption,
    fontFamily: Typography.small.fontFamily,
  },
});
