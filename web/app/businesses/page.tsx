import Link from 'next/link';

import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { listPublicOrganizations } from '@web/lib/public-organizations';

export default async function PublicBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  let orgs: Awaited<ReturnType<typeof listPublicOrganizations>> = [];
  try {
    orgs = await listPublicOrganizations(q);
  } catch {
    orgs = [];
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Businesses</h1>
      <form className="mt-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search"
          className="w-full max-w-xl rounded-2xl border border-line bg-surface-input px-4 py-3"
        />
      </form>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {orgs.map((org) => (
          <li key={org.id} className="rounded-2xl border border-line bg-surface-card p-4">
            <Link className="text-lg font-semibold hover:text-primary" href={`/businesses/${org.id}`}>
              {org.name}
            </Link>
            <p className="text-sm text-ink-secondary">
              {getOrganizationCategoryLabel(org.category)} · {org.city}
            </p>
          </li>
        ))}
      </ul>
      {orgs.length === 0 ? (
        <p className="mt-6 text-ink-secondary">No public businesses match this search.</p>
      ) : null}
    </main>
  );
}
