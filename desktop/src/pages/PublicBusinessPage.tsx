import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { getPublicOrganization } from '../lib/public-organizations';
import { Card, EmptyState, LoadingSkeleton } from '@web/components/ui';

export default function PublicBusinessPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ['desktop', 'public-org', id],
    queryFn: () => getPublicOrganization(id!),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <LoadingSkeleton />;
  if (!query.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState title="Business not found" />
      </main>
    );
  }

  const org = query.data;
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">{org.name}</h1>
      <p className="text-ink-secondary">
        {getOrganizationCategoryLabel(org.category)} · {org.city}
      </p>
      <Card>
        <p>{org.description}</p>
        <p className="mt-2 text-sm text-ink-secondary">{org.address}</p>
      </Card>
      <Link
        className="inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-white"
        to={`/login?next=/customer/join/${org.id}`}
      >
        Sign in to join queue
      </Link>
    </main>
  );
}
