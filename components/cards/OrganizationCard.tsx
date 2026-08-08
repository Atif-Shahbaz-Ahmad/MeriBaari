import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Building2,
  Car,
  GraduationCap,
  Hospital,
  Landmark,
  MapPin,
  Star,
  Stethoscope,
  UtensilsCrossed,
  Clock3,
} from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';
import type { Organization } from '@/types';

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

interface OrganizationCardProps {
  organization: Organization;
  onPress?: () => void;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OrganizationCard({
  organization,
  onPress,
  compact = false,
}: OrganizationCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const Icon = LOGO_ICONS[organization.logoIcon] ?? Building2;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (compact) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.compact,
          Shadows.card,
          animatedStyle,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.logo}>
          <Icon size={22} color={Colors.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {organization.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>
          {formatCategory(organization.category)}
        </Text>
        <View style={styles.compactMeta}>
          <Clock3 size={12} color={Colors.accent} />
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            ~{formatWaitTime(organization.averageWaitMinutes)}
          </Text>
        </View>
      </AnimatedPressable>
    );
  }

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
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.logo}>
        <Icon size={24} color={Colors.primary} strokeWidth={2} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {organization.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {formatCategory(organization.category)} · {organization.city}
        </Text>

        <View style={styles.stats}>
          <StatPill
            icon={<Clock3 size={12} color={Colors.accent} />}
            label={`~${formatWaitTime(organization.averageWaitMinutes)}`}
          />
          <StatPill
            icon={<MapPin size={12} color={Colors.primary} />}
            label={`${organization.distanceKm.toFixed(1)} km`}
          />
          <StatPill
            icon={<Star size={12} color={Colors.secondary} />}
            label={organization.rating.toFixed(1)}
          />
        </View>

        <Text style={[styles.queues, { color: theme.textSecondary }]}>
          {organization.activeQueues} active queue{organization.activeQueues === 1 ? '' : 's'}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.background }]}>
      {icon}
      <Text style={[styles.pillText, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function formatCategory(category: Organization['category']) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  compact: {
    width: 156,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.caption,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillText: {
    ...Typography.caption,
  },
  queues: {
    ...Typography.caption,
    marginTop: 2,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
