import type { OrganizationCategory } from '@/types/organization';

/** Discover list sort options (rating omitted until reviews ship). */
export type DiscoverSort = 'relevance' | 'price' | 'distance' | 'name';

export type DiscoverFilters = {
  sort: DiscoverSort;
  /** Mirrors category chips; sheet can override. */
  category: OrganizationCategory | 'all';
  /** Only organizations currently accepting queues. */
  openOnly: boolean;
  /** When set, hide orgs farther than this (requires user location). */
  maxDistanceKm: number | null;
};

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = {
  sort: 'relevance',
  category: 'all',
  openOnly: true,
  maxDistanceKm: null,
};

export const DISCOVER_SORT_OPTIONS: { key: DiscoverSort; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'distance', label: 'Distance' },
  { key: 'price', label: 'Price' },
  { key: 'name', label: 'Name' },
];

export const DISCOVER_DISTANCE_OPTIONS: {
  value: number | null;
  label: string;
}[] = [
  { value: null, label: 'Any distance' },
  { value: 2, label: 'Within 2 km' },
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
];
