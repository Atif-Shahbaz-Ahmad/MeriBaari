import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Star } from 'lucide-react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import {
  formatTicketDate,
  formatTicketTime,
  formatWaitTime,
} from '@/utils/formatting';
import type { QueueTicket } from '@/types';

interface HistoryCardProps {
  ticket: QueueTicket;
  onPress?: () => void;
  onRatePress?: () => void;
  rated?: boolean;
  rateLabel?: string;
  ratedLabel?: string;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HistoryCard({
  ticket,
  onPress,
  onRatePress,
  rated = false,
  rateLabel = 'Rate visit',
  ratedLabel = 'Rated',
  index = 0,
}: HistoryCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const stamp = ticket.completedAt ?? ticket.cancelledAt ?? ticket.joinedAt;
  const canRate =
    typeof onRatePress === 'function' &&
    (ticket.status === 'completed' || ticket.status === 'served');

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(380)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.card,
          Shadows.card,
          animatedStyle,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.top}>
          <View style={styles.left}>
            <Text style={[styles.ticket, { color: Colors.primary }]}>
              {ticket.ticketNumber}
            </Text>
            <Text style={[styles.org, { color: theme.text }]} numberOfLines={1}>
              {ticket.organizationName}
            </Text>
            <Text
              style={[styles.service, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {ticket.serviceName}
            </Text>
          </View>
          <StatusBadge status={ticket.status} showIcon />
        </View>

        <View style={[styles.bottom, { borderTopColor: theme.border }]}>
          <Text style={[styles.meta, { color: theme.textMuted }]}>
            {formatTicketDate(stamp)} · {formatTicketTime(stamp)}
          </Text>
          {ticket.actualWaitMinutes != null ? (
            <Text style={[styles.wait, { color: theme.textSecondary }]}>
              Waited {formatWaitTime(ticket.actualWaitMinutes)}
            </Text>
          ) : null}
        </View>

        {canRate ? (
          <Pressable
            onPress={onRatePress}
            disabled={rated}
            style={[
              styles.rateBtn,
              {
                backgroundColor: rated ? theme.background : theme.tints.primary.bg,
                borderColor: theme.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={rated ? ratedLabel : rateLabel}
            accessibilityState={{ disabled: rated }}
          >
            <Star
              size={14}
              color={rated ? theme.textMuted : Colors.secondary}
              fill={rated ? theme.textMuted : Colors.secondary}
            />
            <Text
              style={[
                styles.rateText,
                { color: rated ? theme.textMuted : Colors.primary },
              ]}
            >
              {rated ? ratedLabel : rateLabel}
            </Text>
          </Pressable>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  ticket: {
    ...Typography.h3,
  },
  org: {
    ...Typography.bodyMedium,
  },
  service: {
    ...Typography.caption,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
  },
  meta: {
    ...Typography.caption,
  },
  wait: {
    ...Typography.small,
  },
  rateBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rateText: {
    ...Typography.small,
    fontWeight: '600',
  },
});
