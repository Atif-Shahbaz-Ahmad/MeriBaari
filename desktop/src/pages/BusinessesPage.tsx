import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { listPublicOrganizations } from '../lib/public-organizations';
import { Card, EmptyState, LoadingSkeleton } from '@web/components/ui';

export default function BusinessesPage() {
  const query = useQuery({
    queryKey: ['desktop', 'public-orgs', 'all'],
    queryFn: () => listPublicOrganizations(),
  });

  if (query.isLoading) return <LoadingSkeleton />;
  if (!query.data?.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState title="No public businesses yet" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">Businesses</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {query.data.map((org) => (
          <Link key={org.id} to={`/businesses/${org.id}`}>
            <Card>
              <p className="font-semibold">{org.name}</p>
              <p className="text-sm text-ink-secondary">{org.city}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
