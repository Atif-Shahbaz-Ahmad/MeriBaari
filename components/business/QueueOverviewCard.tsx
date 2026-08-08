import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Clock3, Users } from 'lucide-react-native';

import { QueueStatusBadge } from '@/components/business/QueueStatusBadge';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import type { BusinessQueue } from '@/types';
import { formatWaitTime } from '@/utils/formatting';

interface QueueOverviewCardProps {
  queue: BusinessQueue;
  index?: number;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QueueOverviewCard({ queue, index = 0, onPress }: QueueOverviewCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(400)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={animatedStyle}
        accessibilityRole="button"
        accessibilityLabel={`${queue.departmentName} queue, serving ${queue.currentServing}`}
      >
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={[styles.department, { color: theme.text }]} numberOfLines={1}>
                {queue.departmentName}
              </Text>
              <Text style={[styles.service, { color: theme.textSecondary }]} numberOfLines={1}>
                {queue.serviceName}
              </Text>
            </View>
            <QueueStatusBadge status={queue.status} />
          </View>

          <View style={styles.servingRow}>
            <Text style={[styles.servingLabel, { color: theme.textMuted }]}>Now serving</Text>
            <Text style={[styles.servingNumber, { color: Colors.primary }]}>
              {queue.currentServing}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.metaChip, { backgroundColor: Colors.primary50 }]}>
              <Users size={14} color={Colors.primary} />
              <Text style={[styles.metaText, { color: Colors.primary700 }]}>
                {queue.waitingCount} waiting
              </Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: Colors.accent50 }]}>
              <Clock3 size={14} color={Colors.accent} />
              <Text style={[styles.metaText, { color: '#B45309' }]}>
                ~{formatWaitTime(queue.estimatedWaitMinutes)}
              </Text>
            </View>
          </View>
        </Card>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  department: {
    ...Typography.h3,
  },
  service: {
    ...Typography.caption,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  servingLabel: {
    ...Typography.small,
  },
  servingNumber: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  metaText: {
    ...Typography.caption,
    fontFamily: Typography.small.fontFamily,
  },
});
