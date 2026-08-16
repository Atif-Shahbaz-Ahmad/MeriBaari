import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

import { FavoriteToggleButton } from '@/components/buttons/FavoriteToggleButton';
import { organizationCategoryLabelKey } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatWaitTime } from '@/utils/formatting';
import type { Organization as DomainOrganization } from '@/domain/models';
import type { Organization as CatalogOrganization } from '@/types';

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

type OrganizationCardModel = DomainOrganization | CatalogOrganization;

interface OrganizationCardProps {
  organization: OrganizationCardModel;
  onPress?: () => void;
  compact?: boolean;
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  onToggleFavorite?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OrganizationCard({
  organization,
  onPress,
  compact = false,
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite,
}: OrganizationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const Icon = LOGO_ICONS[organization.logoIcon] ?? Building2;
  const logoUrl =
    'logoUrl' in organization ? organization.logoUrl : undefined;
  const categoryLabel = t(organizationCategoryLabelKey(organization.category));
  const showFavorite = typeof onToggleFavorite === 'function';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const Logo = (
    <View style={[styles.logo, { backgroundColor: theme.tints.primary.bg }]}>
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logoImage}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Icon size={compact ? 22 : 24} color={Colors.primary} strokeWidth={2} />
      )}
    </View>
  );

  const FavoriteControl = showFavorite ? (
    <FavoriteToggleButton
      isFavorite={isFavorite}
      loading={favoriteLoading}
      onPress={onToggleFavorite}
      size={compact ? 16 : 18}
      style={compact ? styles.favoriteCompact : styles.favorite}
    />
  ) : null;

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
        <View style={styles.compactTop}>
          {Logo}
          {FavoriteControl}
        </View>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {organization.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>
          {categoryLabel}
        </Text>
        <View style={styles.compactMeta}>
          <Clock3 size={12} color={Colors.accent} />
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {organization.averageWaitMinutes > 0
              ? `~${formatWaitTime(organization.averageWaitMinutes)}`
              : '—'}
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
      {Logo}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.text, flex: 1 }]} numberOfLines={1}>
            {organization.name}
          </Text>
          {FavoriteControl}
        </View>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {categoryLabel}
          {organization.city ? ` · ${organization.city}` : ''}
        </Text>

        <View style={styles.stats}>
          <StatPill
            icon={<Clock3 size={12} color={Colors.accent} />}
            label={
              organization.averageWaitMinutes > 0
                ? `~${formatWaitTime(organization.averageWaitMinutes)}`
                : 'Wait TBA'
            }
          />
          {organization.distanceKm > 0 ? (
            <StatPill
              icon={<MapPin size={12} color={Colors.primary} />}
              label={`${organization.distanceKm.toFixed(1)} km`}
            />
          ) : null}
          {organization.rating > 0 ? (
            <StatPill
              icon={<Star size={12} color={Colors.secondary} />}
              label={
                organization.reviewCount > 0
                  ? `${organization.rating.toFixed(1)} (${organization.reviewCount})`
                  : organization.rating.toFixed(1)
              }
            />
          ) : null}
        </View>

        <Text style={[styles.queues, { color: theme.textSecondary }]}>
          {organization.activeQueues > 0
            ? t(
                organization.activeQueues === 1
                  ? 'orgCard.activeQueue'
                  : 'orgCard.activeQueues',
                { count: organization.activeQueues },
              )
            : t('orgCard.noQueues')}
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  compactTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  favorite: {
    marginLeft: Spacing.xs,
  },
  favoriteCompact: {
    width: 32,
    height: 32,
  },
});
