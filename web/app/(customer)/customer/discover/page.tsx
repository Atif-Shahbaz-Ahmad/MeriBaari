'use client';

import { useMemo, useState } from 'react';

import { ORGANIZATION_CATEGORIES_WITH_ALL } from '@/constants/organization-categories';
import { useDiscoverSearch } from '@/features/search/hooks/use-discover-search';
import { useUserLocation } from '@/features/search/hooks/use-user-location';
import {
  DEFAULT_DISCOVER_FILTERS,
  DISCOVER_DISTANCE_OPTIONS,
  DISCOVER_SORT_OPTIONS,
  type DiscoverFilters,
} from '@/features/search/types';
import { useTranslation } from '@/hooks/use-translation';
import { BusinessCard } from '@web/components/BusinessCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '@web/components/ui';

export default function DiscoverPage() {
  const { t } = useTranslation();
  const location = useUserLocation({ autoRequest: false });
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_DISCOVER_FILTERS);
  const search = useDiscoverSearch(query, filters, location.coords);

  const cities = useMemo(() => {
    const set = new Set(
      search.results.map((org) => org.city).filter((city) => city.trim()),
    );
    return [...set].sort();
  }, [search.results]);

  const [city, setCity] = useState('all');
  const visible =
    city === 'all'
      ? search.results
      : search.results.filter((org) => org.city === city);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t('discover.title')}</h1>
        <p className="text-ink-secondary">{t('discover.subtitle')}</p>
      </header>
      <input
        className="w-full max-w-xl rounded-2xl border border-line bg-surface-input px-4 py-3"
        placeholder={t('discover.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-xl border border-line bg-surface-input px-3 py-2"
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              category: e.target.value as DiscoverFilters['category'],
            }))
          }
        >
          {ORGANIZATION_CATEGORIES_WITH_ALL.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-line bg-surface-input px-3 py-2"
          value={filters.sort}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              sort: e.target.value as DiscoverFilters['sort'],
            }))
          }
        >
          {DISCOVER_SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-line bg-surface-input px-3 py-2"
          value={filters.maxDistanceKm ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              maxDistanceKm: e.target.value ? Number(e.target.value) : null,
            }))
          }
        >
          {DISCOVER_DISTANCE_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-line bg-surface-input px-3 py-2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.openOnly}
            onChange={(e) =>
              setFilters((f) => ({ ...f, openOnly: e.target.checked }))
            }
          />
          Open now
        </label>
        <button
          type="button"
          className="text-sm text-primary"
          onClick={() => void location.request()}
        >
          Use my location
        </button>
      </div>
      {location.error ? (
        <p className="text-sm text-ink-secondary">{location.error}</p>
      ) : null}
      {search.isLoading ? (
        <LoadingSkeleton />
      ) : search.isError ? (
        <ErrorState title={t('discover.loadError')} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={t('discover.emptyTitle')}
          description={t('discover.emptyDescription')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((org) => (
            <BusinessCard key={org.id} org={org} href={`/customer/join/${org.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
