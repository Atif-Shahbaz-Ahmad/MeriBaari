import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Building2,
  Car,
  GraduationCap,
  Hospital,
  Landmark,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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

const LOGO_ICONS = {
  hospital: Hospital,
  bank: Building2,
  building: Building2,
  clinic: Stethoscope,
  university: GraduationCap,
  utensils: UtensilsCrossed,
  landmark: Landmark,
  car: Car,
} as const;

interface TicketCardProps {
  ticket: QueueTicket;
  onPress?: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TicketCard({ ticket, onPress, index = 0 }: TicketCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const Icon = LOGO_ICONS[ticket.logoIcon ?? 'building'] ?? Building2;

  const waitLabel =
    ticket.status === 'completed' && ticket.actualWaitMinutes != null
      ? formatWaitTime(ticket.actualWaitMinutes)
      : ticket.status === 'waiting' || ticket.status === 'almost' || ticket.status === 'serving'
        ? formatWaitTime(ticket.estimatedWaitMinutes)
        : '—';

  const completionLabel = ticket.completedAt
    ? formatTicketTime(ticket.completedAt)
    : ticket.cancelledAt
      ? formatTicketTime(ticket.cancelledAt)
      : ticket.estimatedCompletionAt
        ? `Est. ${formatTicketTime(ticket.estimatedCompletionAt)}`
        : '—';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
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
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: Colors.primary50 }]}>
            <Icon size={20} color={Colors.primary} strokeWidth={1.75} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.org, { color: theme.text }]} numberOfLines={1}>
              {ticket.organizationName}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
              {ticket.departmentName} · {ticket.serviceName}
            </Text>
          </View>
          <StatusBadge status={ticket.status} showIcon />
        </View>

        <View style={styles.row}>
          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>Queue No.</Text>
            <Text style={[styles.number, { color: Colors.primary }]}>{ticket.ticketNumber}</Text>
          </View>
          <View style={styles.rightMeta}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Date</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {formatTicketDate(ticket.joinedAt)}
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <MetaPill label="Wait" value={waitLabel} themeText={theme.text} muted={theme.textMuted} />
          <MetaPill
            label={ticket.completedAt ? 'Completed' : 'Time'}
            value={completionLabel}
            themeText={theme.text}
            muted={theme.textMuted}
          />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function MetaPill({
  label,
  value,
  themeText,
  muted,
}: {
  label: string;
  value: string;
  themeText: string;
  muted: string;
}) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.label, { color: muted }]}>{label}</Text>
      <Text style={[styles.value, { color: themeText }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm + 2,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  org: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.caption,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rightMeta: {
    alignItems: 'flex-end',
  },
  label: {
    ...Typography.caption,
  },
  number: {
    ...Typography.h2,
    marginTop: 2,
  },
  value: {
    ...Typography.small,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm + 2,
    gap: Spacing.lg,
  },
  pill: {
    gap: 2,
  },
});
