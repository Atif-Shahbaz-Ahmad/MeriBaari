'use client';

import Link from 'next/link';

import { getGreeting } from '@/utils/formatting';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useRecentActivity } from '@/features/home/hooks/use-recent-activity';
import { useNearbyOrganizations } from '@/features/home/hooks/use-nearby-organizations';
import { useMyActiveTicket } from '@/features/queue/hooks/use-queue-queries';
import { useMyTicketsRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useFavoriteOrganizations } from '@/features/favorites/hooks/use-favorites';
import { Card, EmptyState, ErrorState, LoadingSkeleton } from '@web/components/ui';

export default function CustomerHomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const activity = useRecentActivity();
  const nearby = useNearbyOrganizations();
  const ticket = useMyActiveTicket();
  useMyTicketsRealtime(ticket.data?.queueId);
  const favorites = useFavoriteOrganizations();
  const name = user?.fullName?.split(' ')[0] ?? '';

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-ink-secondary">{getGreeting()}</p>
        <h1 className="text-3xl font-bold">{name ? `${name}` : 'MeriBaari'}</h1>
      </header>

      <form action="/customer/discover" className="max-w-xl">
        <label className="sr-only" htmlFor="home-search">
          Search
        </label>
        <input
          id="home-search"
          name="q"
          placeholder={t('discover.searchPlaceholder') === 'discover.searchPlaceholder' ? 'Search businesses or services' : t('discover.searchPlaceholder')}
          className="w-full rounded-2xl border border-line bg-surface-input px-4 py-3"
        />
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">{t('home.yourQueue')}</h2>
          {ticket.isLoading ? (
            <LoadingSkeleton count={1} />
          ) : ticket.data ? (
            <Link href="/customer/tickets" className="mt-2 block">
              <p className="text-2xl font-bold text-primary">{ticket.data.ticketNumber}</p>
              <p className="text-sm text-ink-secondary">
                {ticket.data.organizationName} · {ticket.data.serviceName}
              </p>
              <p className="text-sm">
                Position {ticket.data.position} · {ticket.data.status}
              </p>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-ink-secondary">No active ticket.</p>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold">{t('web.nav.assistant')}</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Search businesses, check your queue, or get help in English, Urdu, or Roman Urdu.
          </p>
          <Link className="mt-3 inline-block font-semibold text-primary" href="/customer/assistant">
            Open assistant
          </Link>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('home.nearbyServices')}</h2>
          <Link className="text-sm text-primary" href="/customer/nearby">
            {t('home.seeAll')}
          </Link>
        </div>
        {nearby.isLoading ? (
          <LoadingSkeleton />
        ) : nearby.isError ? (
          <ErrorState title="Could not load nearby businesses" onRetry={() => void nearby.refetch()} />
        ) : nearby.items.length === 0 ? (
          <EmptyState title="No nearby businesses yet" description="Approved businesses near you will appear here." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {nearby.items.map((item) => (
              <Link key={item.id} href={`/customer/join/${item.id}`} className="block">
                <Card>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-ink-secondary">
                    {item.distanceKm ? `${item.distanceKm} km` : item.category}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{t('home.recentActivity')}</h2>
        {activity.isLoading ? (
          <LoadingSkeleton />
        ) : activity.items.length === 0 ? (
          <EmptyState title="No recent activity" description="Queue updates from your tickets will show up here." />
        ) : (
          <ul className="space-y-2">
            {activity.items.map((item) => (
              <li key={item.id}>
                <Card>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-ink-secondary">{item.subtitle}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('web.nav.favorites')}</h2>
          <Link className="text-sm text-primary" href="/customer/favorites">
            {t('home.seeAll')}
          </Link>
        </div>
        {favorites.data?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {favorites.data.slice(0, 4).map((org) => (
              <Link key={org.id} href={`/customer/join/${org.id}`}>
                <Card>
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-sm text-ink-secondary">{org.city}</p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No favorites yet" />
        )}
      </section>
    </div>
  );
}
