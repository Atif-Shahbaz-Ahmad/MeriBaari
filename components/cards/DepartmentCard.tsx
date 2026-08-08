import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Car,
  CircleDot,
  Eye,
  FileText,
  FlaskConical,
  HeartPulse,
  ScanLine,
  Siren,
  Stethoscope,
  Users,
} from 'lucide-react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';
import type { AvailabilityStatus, Department } from '@/types';

const DEPT_ICONS = {
  stethoscope: Stethoscope,
  heart: HeartPulse,
  tooth: CircleDot,
  eye: Eye,
  siren: Siren,
  scan: ScanLine,
  flask: FlaskConical,
  users: Users,
  file: FileText,
  car: Car,
} as const;

interface DepartmentCardProps {
  department: Department;
  selected?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DepartmentCard({ department, selected = false, onPress }: DepartmentCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const Icon = DEPT_ICONS[department.icon] ?? Stethoscope;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
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
        {
          backgroundColor: theme.card,
          borderColor: selected ? Colors.primary : theme.border,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon size={22} color={Colors.primary} strokeWidth={2} />
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]}>{department.name}</Text>
          <AvailabilityBadge status={department.availability} />
        </View>
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
          {department.description}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: theme.textMuted }]}>
            Avg wait ~{formatWaitTime(department.averageWaitMinutes)}
          </Text>
          <Text style={[styles.metaText, { color: theme.textMuted }]}>·</Text>
          <Text style={[styles.metaText, { color: theme.textMuted }]}>
            ~{department.estimatedQueueSize} in queue
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  if (status === 'open') return <StatusBadge status="live" label="Available" />;
  if (status === 'busy') return <StatusBadge status="waiting" label="Busy" />;
  return <StatusBadge status="cancelled" label="Closed" />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  name: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  description: {
    ...Typography.caption,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  metaText: {
    ...Typography.caption,
  },
});
