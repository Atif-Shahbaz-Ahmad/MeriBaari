import type { Organization } from '@/domain/models';
import {
  formatDistanceKm,
  haversineKm,
  hasValidCoords,
  type GeoCoords,
} from '@/lib/geo';
import type { DiscoverFilters } from '@/features/search/types';

export type DiscoverOrganization = Organization & {
  /** Lowest active service price when known (for price sort). */
  startingPrice?: number | null;
  /** True when the text query matched a service name. */
  matchedViaService?: boolean;
};

export function attachDistances(
  organizations: Organization[],
  userLocation: GeoCoords | null | undefined,
): DiscoverOrganization[] {
  if (!userLocation) {
    return organizations.map((org) => ({ ...org }));
  }

  return organizations.map((org) => {
    if (!hasValidCoords(org.latitude, org.longitude)) {
      return { ...org };
    }
    const km = haversineKm(userLocation, {
      latitude: org.latitude,
      longitude: org.longitude!,
    });
    return {
      ...org,
      distanceKm: Math.round(km * 10) / 10,
    };
  });
}

export function applyDiscoverFilters(
  organizations: DiscoverOrganization[],
  filters: DiscoverFilters,
  options?: { query?: string; hasUserLocation?: boolean },
): DiscoverOrganization[] {
  const query = options?.query?.trim().toLowerCase() ?? '';
  let list = [...organizations];

  if (filters.openOnly) {
    list = list.filter((org) => org.isActive && org.status === 'active');
  }

  if (filters.category !== 'all') {
    list = list.filter((org) => org.category === filters.category);
  }

  if (
    filters.maxDistanceKm != null &&
    options?.hasUserLocation &&
    Number.isFinite(filters.maxDistanceKm)
  ) {
    list = list.filter(
      (org) =>
        org.distanceKm > 0 && org.distanceKm <= (filters.maxDistanceKm as number),
    );
  }

  switch (filters.sort) {
    case 'distance':
      list.sort((a, b) => {
        const da = a.distanceKm > 0 ? a.distanceKm : Number.POSITIVE_INFINITY;
        const db = b.distanceKm > 0 ? b.distanceKm : Number.POSITIVE_INFINITY;
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name);
      });
      break;
    case 'price':
      list.sort((a, b) => {
        const pa =
          typeof a.startingPrice === 'number'
            ? a.startingPrice
            : Number.POSITIVE_INFINITY;
        const pb =
          typeof b.startingPrice === 'number'
            ? b.startingPrice
            : Number.POSITIVE_INFINITY;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      });
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'relevance':
    default:
      if (query) {
        list.sort((a, b) => {
          const score = (org: DiscoverOrganization) => {
            const name = org.name.toLowerCase();
            if (name.startsWith(query)) return 0;
            if (name.includes(query)) return 1;
            if (org.matchedViaService) return 2;
            return 3;
          };
          const diff = score(a) - score(b);
          if (diff !== 0) return diff;
          return a.name.localeCompare(b.name);
        });
      } else {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
      break;
  }

  return list;
}

export function distanceLabel(org: DiscoverOrganization): string | null {
  if (!(org.distanceKm > 0)) return null;
  return formatDistanceKm(org.distanceKm);
}
