import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock3, Users } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';
import type { QueueTicket } from '@/types';

interface QueueCardProps {
  ticket: QueueTicket;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QueueCard({ ticket, onPress }: QueueCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <>
      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Current Ticket</Text>
          <Text style={[styles.ticket, { color: theme.text }]}>{ticket.ticketNumber}</Text>
        </View>
        <StatusBadge status={ticket.status === 'waiting' ? 'live' : ticket.status} />
      </View>

      <Text style={[styles.location, { color: theme.textSecondary }]}>
        {ticket.locationName} · {ticket.serviceName}
      </Text>

      <View style={styles.metrics}>
        <Metric
          icon={<Users size={16} color={Colors.primary} />}
          label="Your Position"
          value={String(ticket.position)}
        />
        <Metric
          icon={<Clock3 size={16} color={Colors.accent} />}
          label="Est. Wait"
          value={formatWaitTime(ticket.estimatedWaitMinutes)}
        />
        <Metric
          icon={<Users size={16} color={Colors.secondary} />}
          label="People Ahead"
          value={String(ticket.peopleAhead)}
        />
      </View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={animatedStyle}
      >
        <Card style={styles.card}>{content}</Card>
      </AnimatedPressable>
    );
  }

  return <Card style={styles.card}>{content}</Card>;
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.metric, { backgroundColor: theme.background }]}>
      {icon}
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    ...Typography.small,
    fontFamily: Typography.body.fontFamily,
  },
  ticket: {
    ...Typography.h2,
    marginTop: Spacing.xs,
  },
  location: {
    ...Typography.body,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metric: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.sm + 2,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  metricValue: {
    ...Typography.h3,
  },
  metricLabel: {
    ...Typography.caption,
  },
});
