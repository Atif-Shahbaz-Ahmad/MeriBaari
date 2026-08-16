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

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatDistanceKm } from '@/lib/geo';
import { formatWaitTime } from '@/utils/formatting';
import { useTranslation } from '@/hooks/use-translation';
import { organizationCategoryLabelKey } from '@/constants/organization-categories';
import type { NearbyService } from '@/types';

const ICON_MAP = {
  hospital: Hospital,
  bank: Building2,
  building: Building2,
  clinic: Stethoscope,
  university: GraduationCap,
  utensils: UtensilsCrossed,
  landmark: Landmark,
  car: Car,
} as const;

interface ServiceCardProps {
  service: NearbyService;
  onPress?: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const Icon = ICON_MAP[service.icon] ?? Building2;
  const distanceLabel =
    typeof service.distanceKm === 'number' && service.distanceKm > 0
      ? formatDistanceKm(service.distanceKm)
      : null;
  const categoryLabel = t(organizationCategoryLabelKey(service.category));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={service.name}
      style={[
        styles.card,
        Shadows.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.tints.primary.bg }]}>
        <Icon size={22} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {service.name}
      </Text>
      <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>
        {categoryLabel}
      </Text>
      <Text style={[styles.meta, { color: theme.textMuted }]}>
        ~{formatWaitTime(service.averageWaitMinutes)}
      </Text>
      {distanceLabel ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {distanceLabel}
        </Text>
      ) : null}
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
