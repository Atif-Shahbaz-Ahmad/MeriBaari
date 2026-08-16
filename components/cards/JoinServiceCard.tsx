import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';
import type { AvailabilityStatus, QueueService } from '@/types';
import type { Service as DomainService } from '@/domain/models';

type ServiceCardModel = DomainService | QueueService;

interface ServiceCardProps {
  service: ServiceCardModel;
  selected?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Service selection card for the Join Queue flow.
 * Distinct from the Home NearbyService `ServiceCard` (components/cards/ServiceCard.tsx).
 */
export function JoinServiceCard({ service, selected = false, onPress }: ServiceCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

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
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.name, { color: theme.text }]}>{service.name}</Text>
          <AvailabilityBadge status={service.availability} />
        </View>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? Colors.primary : theme.border,
              backgroundColor: selected ? Colors.primary : 'transparent',
            },
          ]}
        >
          {selected ? <Check size={14} color={Colors.textInverse} strokeWidth={3} /> : null}
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textSecondary }]}>{service.description}</Text>

      <View style={styles.metaRow}>
        <Meta
          label="Duration"
          value={formatWaitTime(
            'durationMinutes' in service
              ? service.durationMinutes
              : service.estimatedDurationMinutes,
          )}
        />
        <Meta
          label="Price"
          value={
            service.price === null || service.price === undefined
              ? '—'
              : `Rs ${Number(service.price).toFixed(0)}`
          }
        />
        <Meta
          label="Status"
          value={
            ('isActive' in service ? service.isActive : true)
              ? 'Available'
              : 'Inactive'
          }
        />
      </View>
    </AnimatedPressable>
  );
}

/** Alias matching the prompt naming for Join Queue service selection. */
export const ServiceSelectCard = JoinServiceCard;

function Meta({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.meta, { backgroundColor: theme.background }]}>
      <Text style={[styles.metaValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metaLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
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
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.sm,
  },
  name: {
    ...Typography.bodyMedium,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  description: {
    ...Typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  meta: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 2,
  },
  metaValue: {
    ...Typography.small,
  },
  metaLabel: {
    ...Typography.caption,
  },
});
