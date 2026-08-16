import type { Favorite } from '@/domain/models/favorite';
import type { Organization } from '@/domain/models/organization';
import { isOrganizationPublic } from '@/domain/models/organization';
import type { FavoritesRepository } from '@/domain/repositories/favorites.repository';
import {
  OrganizationError,
  toOrganizationError,
} from '@/domain/errors/organization-error';
import { mapOrganizationRow } from '@/data/supabase/mappers';
import { requireSupabase } from '@/lib/supabase';
import type { OrganizationRow } from '@/supabase/types/database';

type FavoriteRow = {
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  organizations?: OrganizationRow | OrganizationRow[] | null;
};

function mapFavoriteRow(row: FavoriteRow): Favorite {
  const orgRaw = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations;
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    organization: orgRaw ? mapOrganizationRow(orgRaw) : null,
  };
}

async function requireUserId(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) {
    throw new OrganizationError('unauthorized', 'Please sign in to manage favorites.');
  }
  return data.user.id;
}

export class SupabaseFavoritesRepository implements FavoritesRepository {
  async list(userId?: string): Promise<Favorite[]> {
    const supabase = requireSupabase();
    try {
      const uid = await requireUserId(userId);
      const { data, error } = await supabase
        .from('favorites')
        .select('*, organizations(*)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapFavoriteRow(row as FavoriteRow));
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async listOrganizations(userId?: string): Promise<Organization[]> {
    const favorites = await this.list(userId);
      return favorites
        .map((f) => f.organization)
        .filter((org): org is Organization =>
          Boolean(org && isOrganizationPublic(org)),
        );
  }

  async listOrganizationIds(userId?: string): Promise<string[]> {
    const supabase = requireSupabase();
    try {
      const uid = await requireUserId(userId);
      const { data, error } = await supabase
        .from('favorites')
        .select('organization_id')
        .eq('user_id', uid);
      if (error) throw error;
      return (data ?? []).map((row) => row.organization_id as string);
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async isFavorite(organizationId: string, userId?: string): Promise<boolean> {
    const supabase = requireSupabase();
    try {
      const uid = await requireUserId(userId);
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', uid)
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async add(organizationId: string, userId?: string): Promise<Favorite> {
    const supabase = requireSupabase();
    try {
      const uid = await requireUserId(userId);
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: uid,
          organization_id: organizationId,
        })
        .select('*, organizations(*)')
        .single();
      if (error) {
        if (error.code === '23505') {
          throw new OrganizationError(
            'duplicate',
            'This place is already in your favorites.',
          );
        }
        throw error;
      }
      return mapFavoriteRow(data as FavoriteRow);
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async remove(organizationId: string, userId?: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      const uid = await requireUserId(userId);
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', uid)
        .eq('organization_id', organizationId);
      if (error) throw error;
    } catch (e) {
      throw toOrganizationError(e);
    }
  }
}
