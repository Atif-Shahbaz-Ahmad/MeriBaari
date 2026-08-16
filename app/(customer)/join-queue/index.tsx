import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SlidersHorizontal } from 'lucide-react-native';

import { OrganizationCard } from '@/components/cards/OrganizationCard';
import { Screen } from '@/components/layout/Screen';
import { SearchFiltersSheet } from '@/components/search/SearchFiltersSheet';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ORGANIZATION_CATEGORIES_WITH_ALL, organizationCategoryLabelKey } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import type { Organization } from '@/domain/models';
import {
  useFavoriteOrganizationIds,
  useToggleFavorite,
} from '@/features/favorites/hooks/use-favorites';
import { useDiscoverSearch } from '@/features/search/hooks/use-discover-search';
import { useUserLocation } from '@/features/search/hooks/use-user-location';
import {
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilters,
} from '@/features/search/types';
import { pushOrganization } from '@/features/queue/navigation';
import { useJoinQueueStore } from '@/store/join-queue-store';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import type { OrganizationCategory } from '@/types';

export default function OrganizationListScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_DISCOVER_FILTERS);
  const [draftFilters, setDraftFilters] = useState<DiscoverFilters>(DEFAULT_DISCOVER_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const location = useUserLocation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const {
    results,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useDiscoverSearch(debouncedQuery, filters, location.coords);

  const { data: favoriteIds = [] } = useFavoriteOrganizationIds();
  const toggleFavorite = useToggleFavorite();

  const openOrganization = (org: Organization) => {
    selectOrganization(org.id);
    pushOrganization(org.id);
  };

  const onToggleFavorite = useCallback(
    (org: Organization) => {
      if (toggleFavorite.isPending) return;
      const currentlyFavorited = favoriteIds.includes(org.id);
      setPendingId(org.id);
      toggleFavorite.mutate(
        {
          organizationId: org.id,
          currentlyFavorited,
          organization: org,
        },
        {
          onSettled: () => setPendingId(null),
        },
      );
    },
    [favoriteIds, toggleFavorite],
  );

  const activeFilterCount =
    (filters.sort !== 'relevance' ? 1 : 0) +
    (filters.openOnly ? 0 : 1) +
    (filters.maxDistanceKm != null ? 1 : 0) +
    (filters.category !== 'all' ? 0 : 0);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title={t('discover.title')}
            subtitle={t('discover.subtitle')}
            onBack={() => router.back()}
          />
          <View style={styles.searchRow}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              style={styles.search}
              placeholder={t('discover.searchPlaceholder')}
            />
            <Pressable
              onPress={() => {
                setDraftFilters(filters);
                setFiltersOpen(true);
              }}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: theme.tints.primary.bg,
                  borderColor: theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('discover.filtersA11y')}
            >
              <SlidersHorizontal size={18} color={Colors.primary} strokeWidth={2} />
              {activeFilterCount > 0 ? (
                <View style={styles.filterDot} />
              ) : null}
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {ORGANIZATION_CATEGORIES_WITH_ALL.map((item) => (
              <CategoryChip
                key={item.id}
                label={t(organizationCategoryLabelKey(item.id))}
                selected={filters.category === item.id}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    category: item.id as OrganizationCategory | 'all',
                  }))
                }
              />
            ))}
          </ScrollView>
        </Animated.View>

        {location.coords ? (
          <Text style={[styles.locationHint, { color: theme.textMuted }]}>
            {t('discover.locationHint')}
          </Text>
        ) : null}

        {isLoading || (isFetching && results.length === 0) ? (
          <View style={styles.padded}>
            <LoadingSkeleton count={4} />
          </View>
        ) : isError ? (
          <ErrorState
            title={t('discover.loadError')}
            description={getOrganizationErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : results.length === 0 ? (
          <EmptyState
            title={t('discover.emptyTitle')}
            description={t('discover.emptyDescription')}
            actionLabel={t('common.clearFilters')}
            onActionPress={() => {
              setQuery('');
              setFilters(DEFAULT_DISCOVER_FILTERS);
            }}
          />
        ) : (
          <OrgSection
            title={t('discover.allOrganizations')}
            subtitle={
              results.length === 1
                ? t('discover.results', { count: results.length })
                : t('discover.results_plural', { count: results.length })
            }
            organizations={results}
            favoriteIds={favoriteIds}
            pendingId={pendingId}
            favoritePending={toggleFavorite.isPending}
            onToggleFavorite={onToggleFavorite}
            onPress={openOrganization}
            delay={100}
          />
        )}
      </ScrollView>

      <SearchFiltersSheet
        visible={filtersOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFiltersOpen(false);
        }}
        locationAvailable={Boolean(location.coords)}
        onRequestLocation={() => void location.request()}
      />
    </Screen>
  );
}

function OrgSection({
  title,
  subtitle,
  organizations,
  favoriteIds,
  pendingId,
  favoritePending,
  onToggleFavorite,
  onPress,
  delay,
}: {
  title: string;
  subtitle?: string;
  organizations: Organization[];
  favoriteIds: string[];
  pendingId: string | null;
  favoritePending: boolean;
  onToggleFavorite: (org: Organization) => void;
  onPress: (org: Organization) => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.padded}>
      <SectionHeader title={title} subtitle={subtitle} style={styles.sectionHeader} />
      <View style={styles.stack}>
        {organizations.map((org) => (
          <OrganizationCard
            key={`${title}-${org.id}`}
            organization={org}
            isFavorite={favoriteIds.includes(org.id)}
            favoriteLoading={favoritePending && pendingId === org.id}
            onToggleFavorite={() => onToggleFavorite(org)}
            onPress={() => onPress(org)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  search: {
    flex: 1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  chips: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  locationHint: {
    ...Typography.caption,
    paddingHorizontal: Spacing.md,
    marginTop: -Spacing.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  stack: {
    gap: Spacing.md,
  },
});
