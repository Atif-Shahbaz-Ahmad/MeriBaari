import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getQueueStatusMeta } from '@/features/business/status';
import type { BusinessQueueStatus } from '@/types';

interface QueueStatusBadgeProps {
  status: BusinessQueueStatus;
  size?: 'sm' | 'md';
}

export function QueueStatusBadge({ status, size = 'sm' }: QueueStatusBadgeProps) {
  const meta = getQueueStatusMeta(status);

  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: meta.background },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Queue status ${meta.label}`}
    >
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, size === 'md' && styles.labelMd, { color: meta.color }]}>
        {meta.label}
      </Text>
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
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
  labelMd: {
    ...Typography.small,
  },
});
