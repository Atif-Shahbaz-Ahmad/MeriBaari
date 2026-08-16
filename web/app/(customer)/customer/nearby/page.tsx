'use client';

import { useNearbyOrganizations } from '@/features/home/hooks/use-nearby-organizations';
import { useUserLocation } from '@/features/search/hooks/use-user-location';
import { useTranslation } from '@/hooks/use-translation';
import { EmptyState, ErrorState, LoadingSkeleton, Button } from '@web/components/ui';
import Link from 'next/link';
import { Card } from '@web/components/ui';

export default function NearbyPage() {
  const { t } = useTranslation();
  const location = useUserLocation({ autoRequest: true });
  const nearby = useNearbyOrganizations();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('web.nav.nearby')}</h1>
      {location.permission === 'denied' ? (
        <EmptyState
          title="Location permission denied"
          description="Enable location in your browser to sort businesses by distance."
        />
      ) : null}
      {location.isLoading || nearby.isLoading ? (
        <LoadingSkeleton />
      ) : nearby.isError ? (
        <ErrorState title={t('discover.loadError')} onRetry={() => void nearby.refetch()} />
      ) : nearby.items.length === 0 ? (
        <EmptyState
          title="No nearby businesses"
          description="Approved businesses with a location will appear here."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {nearby.items.map((item) => (
            <Link key={item.id} href={`/customer/join/${item.id}`}>
              <Card>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-ink-secondary">
                  {item.distanceKm ? `${item.distanceKm} km` : 'Distance unavailable'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Button type="button" variant="ghost" onClick={() => void location.request()}>
        Retry location
      </Button>
    </div>
  );
}
