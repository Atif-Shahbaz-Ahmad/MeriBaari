'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { isOrganizationPublic } from '@/domain/models';
import { useOrganization } from '@/features/organization/hooks/use-organizations';
import { useDepartments } from '@/features/structure/hooks/use-structure-queries';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { buildStaticMapPreviewUrl, hasValidCoords, openMapsLocation } from '@/lib/geo';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from '@web/components/ui';

export default function JoinBusinessPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const orgQuery = useOrganization(orgId);
  const departments = useDepartments(orgId, { activeOnly: true });
  const { isFavorite } = useIsFavorite(orgId);
  const toggle = useToggleFavorite();
  const org = orgQuery.data;

  if (orgQuery.isLoading) return <LoadingSkeleton count={4} />;
  if (orgQuery.isError || !org) {
    return (
      <ErrorState
        title="Could not load business"
        onRetry={() => void orgQuery.refetch()}
      />
    );
  }

  const publicLive = isOrganizationPublic(org);
  const mapUrl =
    hasValidCoords(org.latitude, org.longitude) && org.latitude && org.longitude
      ? buildStaticMapPreviewUrl(org.latitude, org.longitude)
      : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <p className="text-ink-secondary">
            {getOrganizationCategoryLabel(org.category)} · {org.city}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge
            label={publicLive ? 'Visible' : org.status}
            tone={publicLive ? 'secondary' : 'accent'}
          />
          <Button
            variant="ghost"
            onClick={() =>
              void toggle.mutateAsync({
                organizationId: org.id,
                currentlyFavorited: isFavorite,
                organization: org,
              })
            }
          >
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </Button>
        </div>
      </header>
      {org.description ? <p>{org.description}</p> : null}
      <p className="text-sm text-ink-secondary">{org.address}</p>
      {mapUrl ? (
        <button
          type="button"
          onClick={() =>
            void openMapsLocation({
              latitude: org.latitude,
              longitude: org.longitude,
              label: org.name,
              address: org.address,
            })
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapUrl}
            alt={`Map of ${org.name}`}
            className="h-48 w-full rounded-2xl object-cover"
          />
        </button>
      ) : null}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Departments & services</h2>
        {departments.isLoading ? (
          <LoadingSkeleton />
        ) : departments.data?.length ? (
          <div className="space-y-3">
            {departments.data.map((dept) => (
              <Card key={dept.id}>
                <p className="font-semibold">{dept.name}</p>
                <Link
                  className="mt-2 inline-block text-sm font-semibold text-primary"
                  href={`/customer/join/${org.id}/departments/${dept.id}`}
                >
                  View services
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No departments yet" />
        )}
      </section>
    </div>
  );
}
