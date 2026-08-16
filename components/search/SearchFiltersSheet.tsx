import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Button } from '@/components/ui/Button';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { ORGANIZATION_CATEGORIES_WITH_ALL, organizationCategoryLabelKey } from '@/constants/organization-categories';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  DEFAULT_DISCOVER_FILTERS,
  DISCOVER_DISTANCE_OPTIONS,
  type DiscoverFilters,
  type DiscoverSort,
} from '@/features/search/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import type { OrganizationCategory } from '@/types';

type SearchFiltersSheetProps = {
  visible: boolean;
  value: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
  onClose: () => void;
  onApply: (next: DiscoverFilters) => void;
  locationAvailable: boolean;
  onRequestLocation?: () => void;
};

const SORT_KEYS: DiscoverSort[] = ['relevance', 'distance', 'price', 'name'];

export function SearchFiltersSheet({
  visible,
  value,
  onChange,
  onClose,
  onApply,
  locationAvailable,
  onRequestLocation,
}: SearchFiltersSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const setSort = (sort: DiscoverSort) => {
    onChange({ ...value, sort });
    if (sort === 'distance' && !locationAvailable) {
      onRequestLocation?.();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
      <View style={[styles.sheet, { backgroundColor: theme.card }]}>
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('filters.closeA11y')}
            style={styles.closeBtn}
          >
            <X size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{t('filters.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('filters.subtitle')}
        </Text>

        <Text style={[styles.section, { color: theme.text }]}>{t('filters.sortBy')}</Text>
        <View style={styles.chips}>
          {SORT_KEYS.map((key) => (
            <CategoryChip
              key={key}
              label={t(`filters.sort.${key}`)}
              selected={value.sort === key}
              onPress={() => setSort(key)}
            />
          ))}
        </View>

        <Text style={[styles.section, { color: theme.text }]}>{t('filters.category')}</Text>
        <View style={styles.chips}>
          {ORGANIZATION_CATEGORIES_WITH_ALL.map((item) => (
            <CategoryChip
              key={item.id}
              label={t(organizationCategoryLabelKey(item.id))}
              selected={value.category === item.id}
              onPress={() =>
                onChange({
                  ...value,
                  category: item.id as OrganizationCategory | 'all',
                })
              }
            />
          ))}
        </View>

        <Text style={[styles.section, { color: theme.text }]}>{t('filters.availability')}</Text>
        <View style={styles.chips}>
          <CategoryChip
            label={t('filters.openNow')}
            selected={value.openOnly}
            onPress={() => onChange({ ...value, openOnly: true })}
          />
          <CategoryChip
            label={t('filters.includeInactive')}
            selected={!value.openOnly}
            onPress={() => onChange({ ...value, openOnly: false })}
          />
        </View>

        <Text style={[styles.section, { color: theme.text }]}>{t('filters.distance')}</Text>
        {!locationAvailable ? (
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            {t('filters.locationHint')}
          </Text>
        ) : null}
        <View style={styles.chips}>
          {DISCOVER_DISTANCE_OPTIONS.map((option) => (
            <CategoryChip
              key={String(option.value)}
              label={
                option.value == null
                  ? t('filters.distanceOption.any')
                  : t(`filters.distanceOption.${option.value}`)
              }
              selected={value.maxDistanceKm === option.value}
              onPress={() => {
                if (option.value != null && !locationAvailable) {
                  onRequestLocation?.();
                }
                onChange({ ...value, maxDistanceKm: option.value });
              }}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <View style={styles.actionHalf}>
            <Button
              title={t('filters.reset')}
              variant="outline"
              onPress={() => onChange({ ...DEFAULT_DISCOVER_FILTERS })}
            />
          </View>
          <View style={styles.actionHalf}>
            <PrimaryButton title={t('filters.apply')} onPress={() => onApply(value)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    maxHeight: '88%',
  },
  handleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h3,
  },
  subtitle: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  section: {
    ...Typography.small,
    marginTop: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  hint: {
    ...Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionHalf: {
    flex: 1,
  },
});
