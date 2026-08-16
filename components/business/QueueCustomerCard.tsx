import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Clock3 } from 'lucide-react-native';

import { ActionButton } from '@/components/business/ActionButton';
import { Card } from '@/components/ui/Card';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getPriorityMeta } from '@/features/business/status';
import { useTheme } from '@/hooks/use-theme';
import type { BusinessWaitingCustomer } from '@/types';
import { formatClockTime, formatRelativeTime, formatWaitTime } from '@/utils/formatting';

interface QueueCustomerCardProps {
  customer: BusinessWaitingCustomer;
  index?: number;
  disabled?: boolean;
  onCall?: () => void;
  onSkip?: () => void;
  onRecall?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function QueueCustomerCard({
  customer,
  index = 0,
  disabled = false,
  onCall,
  onSkip,
  onRecall,
  onComplete,
  onCancel,
}: QueueCustomerCardProps) {
  const theme = useTheme();
  const priority = getPriorityMeta(customer.priority, theme.tints);

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 55).duration(380)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.numberBadge, { backgroundColor: theme.tints.primary.bg }]}>
            <Text style={[styles.number, { color: theme.tints.primary.fg }]}>{customer.queueNumber}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {customer.customerName}
            </Text>
            <Text style={[styles.joined, { color: theme.textMuted }]}>
              Joined {formatClockTime(customer.joinedAt)} · {formatRelativeTime(customer.joinedAt)}
            </Text>
          </View>
          <View style={[styles.priority, { backgroundColor: priority.background }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
          </View>
        </View>

        <View style={[styles.serviceRow, { backgroundColor: theme.background }]}>
          <Clock3 size={14} color={theme.textMuted} />
          <Text style={[styles.serviceText, { color: theme.textSecondary }]}>
            Est. service {formatWaitTime(customer.estimatedServiceMinutes)}
          </Text>
          {customer.status === 'called' || customer.status === 'serving' ? (
            <Text style={[styles.live, { color: theme.tints.secondary.fg }]}>
              {customer.status === 'serving' ? 'Serving' : 'Called'}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <ActionButton label="Call" variant="primary" compact disabled={disabled} onPress={onCall} />
          <ActionButton label="Skip" variant="warning" compact disabled={disabled} onPress={onSkip} />
          <ActionButton label="Recall" variant="neutral" compact disabled={disabled} onPress={onRecall} />
          <ActionButton label="Done" variant="success" compact disabled={disabled} onPress={onComplete} />
          <ActionButton label="Cancel" variant="danger" compact disabled={disabled} onPress={onCancel} />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  numberBadge: {
    minWidth: 64,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  number: {
    ...Typography.bodyMedium,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyMedium,
  },
  joined: {
    ...Typography.caption,
  },
  priority: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  priorityText: {
    ...Typography.caption,
    fontFamily: Typography.small.fontFamily,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  serviceText: {
    ...Typography.caption,
    flex: 1,
  },
  live: {
    ...Typography.caption,
    fontFamily: Typography.small.fontFamily,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
});
