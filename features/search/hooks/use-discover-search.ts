import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import {
  applyDiscoverFilters,
  attachDistances,
  type DiscoverOrganization,
} from '@/features/search/apply-discover';
import type { DiscoverFilters } from '@/features/search/types';
import type { GeoCoords } from '@/lib/geo';
import { useAuthStore } from '@/store/auth-store';

export const discoverQueryKeys = {
  all: ['discover'] as const,
  list: (query: string, category: string) =>
    ['discover', 'list', query, category] as const,
  prices: (ids: string[]) => ['discover', 'prices', ...ids] as const,
};

/**
 * Discover search: org + service text match from repository,
 * then client distance/price filter & sort.
 */
export function useDiscoverSearch(
  query: string,
  filters: DiscoverFilters,
  userLocation: GeoCoords | null,
) {
  const userId = useAuthStore((s) => s.user?.id);
  const trimmed = query.trim();

  const organizationsQuery = useQuery({
    queryKey: discoverQueryKeys.list(
      trimmed,
      `${filters.category}:${filters.openOnly ? 'open' : 'all'}`,
    ),
    queryFn: () =>
      getContainer().organizationService.search(trimmed, filters.category, {
        activeOnly: filters.openOnly,
      }),
    enabled: Boolean(userId),
  });

  const orgIds = useMemo(
    () => (organizationsQuery.data ?? []).map((org) => org.id).sort(),
    [organizationsQuery.data],
  );

  const pricesQuery = useQuery({
    queryKey: discoverQueryKeys.prices(orgIds),
    queryFn: () =>
      getContainer().organizationService.getStartingPrices(orgIds),
    enabled: Boolean(userId && orgIds.length > 0 && filters.sort === 'price'),
  });

  const results = useMemo((): DiscoverOrganization[] => {
    const base = attachDistances(
      organizationsQuery.data ?? [],
      userLocation,
    ).map((org) => {
      const startingPrice = pricesQuery.data?.[org.id];
      return {
        ...org,
        startingPrice: startingPrice ?? null,
        matchedViaService: Boolean(
          trimmed &&
            !org.name.toLowerCase().includes(trimmed.toLowerCase()) &&
            !org.description.toLowerCase().includes(trimmed.toLowerCase()) &&
            !org.city.toLowerCase().includes(trimmed.toLowerCase()) &&
            !org.address.toLowerCase().includes(trimmed.toLowerCase()),
        ),
      };
    });

    return applyDiscoverFilters(base, filters, {
      query: trimmed,
      hasUserLocation: Boolean(userLocation),
    });
  }, [
    organizationsQuery.data,
    pricesQuery.data,
    filters,
    userLocation,
    trimmed,
  ]);

  return {
    results,
    isLoading: organizationsQuery.isLoading,
    isFetching: organizationsQuery.isFetching || pricesQuery.isFetching,
    isError: organizationsQuery.isError,
    error: organizationsQuery.error,
    refetch: organizationsQuery.refetch,
  };
}
