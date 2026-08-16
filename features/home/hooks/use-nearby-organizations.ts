import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useDiscoverSearch } from '@/features/search/hooks/use-discover-search';
import { useUserLocation } from '@/features/search/hooks/use-user-location';
import {
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilters,
} from '@/features/search/types';
import { mapOrganizationToNearbyService } from '@/features/home/map-nearby';

export const NEARBY_SERVICES_LIMIT = 8;

/**
 * Customer Home “Nearby Services”: same public visibility as Discover
 * (active + approved subscription), sorted by distance when location exists.
 */
export function useNearbyOrganizations() {
  const location = useUserLocation({ autoRequest: true });

  const filters: DiscoverFilters = useMemo(
    () => ({
      ...DEFAULT_DISCOVER_FILTERS,
      sort: location.coords ? 'distance' : 'name',
      category: 'all',
      openOnly: true,
      maxDistanceKm: null,
    }),
    [location.coords],
  );

  const { results, isLoading, isError, refetch } = useDiscoverSearch(
    '',
    filters,
    location.coords,
  );

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const items = useMemo(
    () =>
      results.slice(0, NEARBY_SERVICES_LIMIT).map(mapOrganizationToNearbyService),
    [results],
  );

  return {
    items,
    isLoading,
    isError,
    refetch,
  };
}
