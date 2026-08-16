'use client';

import { useFavoriteOrganizations } from '@/features/favorites/hooks/use-favorites';
import { useTranslation } from '@/hooks/use-translation';
import { BusinessCard } from '@web/components/BusinessCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '@web/components/ui';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const favorites = useFavoriteOrganizations();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
      {favorites.isLoading ? (
        <LoadingSkeleton />
      ) : favorites.isError ? (
        <ErrorState title="Could not load favorites" onRetry={() => void favorites.refetch()} />
      ) : favorites.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.data.map((org) => (
            <BusinessCard key={org.id} org={org} href={`/customer/join/${org.id}`} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('favorites.emptyTitle') === 'favorites.emptyTitle' ? 'No favorites' : t('favorites.emptyTitle')}
        />
      )}
    </div>
  );
}
