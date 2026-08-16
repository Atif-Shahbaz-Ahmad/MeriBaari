'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

import type { Organization } from '@/domain/models';
import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { Card, StatusBadge } from '@web/components/ui';
import { formatPrice } from '@web/lib/cn';

export function BusinessCard({
  org,
  href,
}: {
  org: Organization & { startingPrice?: number | null };
  href: string;
}) {
  const { isFavorite } = useIsFavorite(org.id);
  const toggle = useToggleFavorite();

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={href} className="text-lg font-semibold hover:text-primary">
            {org.name}
          </Link>
          <p className="text-sm text-ink-secondary">
            {getOrganizationCategoryLabel(org.category)} · {org.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            label={org.status === 'active' ? 'Open' : org.status}
            tone={org.status === 'active' ? 'secondary' : 'muted'}
          />
          <button
            type="button"
            aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
            className="rounded-full p-2 hover:bg-surface"
            onClick={() =>
              void toggle.mutateAsync({
                organizationId: org.id,
                currentlyFavorited: isFavorite,
                organization: org,
              })
            }
          >
            <Heart
              size={18}
              className={isFavorite ? 'fill-danger text-danger' : 'text-ink-muted'}
            />
          </button>
        </div>
      </div>
      {org.description ? (
        <p className="line-clamp-2 text-sm text-ink-secondary">{org.description}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        {org.distanceKm > 0 ? <span>{org.distanceKm} km</span> : null}
        {formatPrice(org.startingPrice) ? <span>From {formatPrice(org.startingPrice)}</span> : null}
        {org.averageWaitMinutes > 0 ? <span>~{org.averageWaitMinutes} min wait</span> : null}
      </div>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
      >
        View business
      </Link>
    </Card>
  );
}
