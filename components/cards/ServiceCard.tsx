import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Building2,
  CreditCard,
  Hospital,
  IdCard,
  Pill,
  Stethoscope,
} from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';
import type { NearbyService } from '@/types';

const ICON_MAP = {
  hospital: Hospital,
  bank: Building2,
  'id-card': IdCard,
  passport: CreditCard,
  clinic: Stethoscope,
  pharmacy: Pill,
} as const;

interface ServiceCardProps {
  service: NearbyService;
  onPress?: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const theme = useTheme();
  const Icon = ICON_MAP[service.icon];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        Shadows.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon size={22} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {service.name}
      </Text>
      <Text style={[styles.meta, { color: theme.textMuted }]}>
        ~{formatWaitTime(service.averageWaitMinutes)}
      </Text>
      <Text style={[styles.meta, { color: theme.textSecondary }]}>
        {service.distanceKm.toFixed(1)} km
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 132,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.caption,
  },
});
