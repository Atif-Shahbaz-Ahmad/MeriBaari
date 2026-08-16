import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { getPublicOrganization } from '@web/lib/public-organizations';
import { createSupabaseServerClient } from '@web/lib/supabase-server';

export default async function PublicBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getPublicOrganization(id);
  if (!org) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, is_active')
    .eq('organization_id', org.id)
    .eq('is_active', true);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <h1 className="text-3xl font-bold">{org.name}</h1>
      <p className="text-ink-secondary">
        {getOrganizationCategoryLabel(org.category)} · {org.city}
      </p>
      <p>{org.description}</p>
      <p className="text-sm">{org.address}</p>
      <section>
        <h2 className="font-semibold">Departments</h2>
        <ul className="mt-2 list-disc pl-5">
          {(departments as Array<{ id: string; name: string }> | null ?? []).map(
            (dept) => (
              <li key={dept.id}>{dept.name}</li>
            ),
          )}
        </ul>
      </section>
      <Link
        className="inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-white"
        href={`/login?next=/customer/join/${org.id}`}
      >
        Sign in to join queue
      </Link>
    </main>
  );
}
