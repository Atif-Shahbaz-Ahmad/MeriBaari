import { mapOrganizationRow } from '@/data/supabase/mappers';
import type { Organization } from '@/domain/models';
import { isOrganizationPublic } from '@/domain/models';
import type { OrganizationRow } from '@/supabase/types';

import { createSupabaseServerClient } from './supabase-server';

export async function listPublicOrganizations(query = ''): Promise<Organization[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'active')
    .eq('subscription_status', 'active')
    .eq('admin_hidden', false)
    .order('name', { ascending: true });
  if (error) throw error;

  let orgs = (data ?? []).map((row) => mapOrganizationRow(row as OrganizationRow));
  const lower = query.trim().toLowerCase();
  if (lower) {
    orgs = orgs.filter(
      (org) =>
        org.name.toLowerCase().includes(lower) ||
        org.description.toLowerCase().includes(lower) ||
        org.city.toLowerCase().includes(lower) ||
        org.address.toLowerCase().includes(lower),
    );
  }
  return orgs.filter(isOrganizationPublic);
}

export async function getPublicOrganization(id: string): Promise<Organization | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const org = mapOrganizationRow(data as OrganizationRow);
  return isOrganizationPublic(org) ? org : null;
}
