import type { Organization, OrganizationMember } from '@/domain/models';
import type {
  OrganizationCreateInput,
  OrganizationRepository,
  OrganizationSearchParams,
  OrganizationUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import {
  OrganizationError,
  toOrganizationError,
} from '@/domain/errors/organization-error';
import { mapOrganizationRow } from '@/data/supabase/mappers';
import { noopSubscribe } from '@/data/mock/noop-subscribe';
import { requireSupabase } from '@/lib/supabase';
import type { OrganizationRow } from '@/supabase/types';

/**
 * Supabase organizations table implementation.
 * UI / services never import this class directly — use the DI container.
 */
export class SupabaseOrganizationRepository implements OrganizationRepository {
  async getById(id: string): Promise<Organization | null> {
    return this.getOrganizationById(id);
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOrganizationRow(data as OrganizationRow) : null;
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async list(params: OrganizationSearchParams = {}): Promise<Organization[]> {
    return this.getOrganizations(params);
  }

  async getOrganizations(
    params: OrganizationSearchParams = {},
  ): Promise<Organization[]> {
    return this.search({ ...params, activeOnly: params.activeOnly ?? true });
  }

  async search(params: OrganizationSearchParams): Promise<Organization[]> {
    const supabase = requireSupabase();
    const activeOnly = params.activeOnly ?? true;
    const query = params.query?.trim() ?? '';
    const category = params.category ?? 'all';

    try {
      let builder = supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (activeOnly) {
        builder = builder.eq('is_active', true).eq('status', 'active');
      }

      if (category !== 'all') {
        builder = builder.eq('category', category);
      }

      if (query) {
        // Filter in memory to avoid brittle PostgREST `or` escaping.
        const { data, error } = await builder;
        if (error) throw error;
        const lower = query.toLowerCase();
        return (data ?? [])
          .map((row) => mapOrganizationRow(row as OrganizationRow))
          .filter(
            (org) =>
              org.name.toLowerCase().includes(lower) ||
              org.description.toLowerCase().includes(lower) ||
              org.city.toLowerCase().includes(lower) ||
              org.address.toLowerCase().includes(lower),
          );
      }

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []).map((row) => mapOrganizationRow(row as OrganizationRow));
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async getMyOrganization(): Promise<Organization | null> {
    const supabase = requireSupabase();
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        throw new OrganizationError('unauthorized', 'Please sign in to continue.');
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', authData.user.id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOrganizationRow(data as OrganizationRow) : null;
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async createOrganization(
    input: OrganizationCreateInput,
  ): Promise<Organization> {
    const supabase = requireSupabase();
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        throw new OrganizationError('unauthorized', 'Please sign in to continue.');
      }

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          owner_id: authData.user.id,
          name: input.name.trim(),
          category: input.category,
          description: input.description?.trim() ?? '',
          phone: input.phone ?? null,
          email: input.email ?? null,
          address: input.address?.trim() ?? '',
          city: input.city?.trim() ?? '',
          logo_url: input.logoUrl ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          working_hours: input.workingHours?.trim() ?? '',
          is_active: true,
          status: 'active',
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) {
        throw new OrganizationError('unknown', 'Failed to create organization.');
      }
      return mapOrganizationRow(data as OrganizationRow);
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async updateOrganization(
    id: string,
    input: OrganizationUpdateInput,
  ): Promise<Organization> {
    const supabase = requireSupabase();
    try {
      const patch: {
        name?: string;
        category?: string;
        description?: string;
        phone?: string | null;
        email?: string | null;
        address?: string;
        city?: string;
        logo_url?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        working_hours?: string;
        average_wait_time?: number;
        is_active?: boolean;
        status?: 'active' | 'inactive' | 'suspended';
      } = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.category !== undefined) patch.category = input.category;
      if (input.description !== undefined) {
        patch.description = input.description.trim();
      }
      if (input.phone !== undefined) patch.phone = input.phone;
      if (input.email !== undefined) patch.email = input.email;
      if (input.address !== undefined) patch.address = input.address.trim();
      if (input.city !== undefined) patch.city = input.city.trim();
      if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
      if (input.latitude !== undefined) patch.latitude = input.latitude;
      if (input.longitude !== undefined) patch.longitude = input.longitude;
      if (input.workingHours !== undefined) {
        patch.working_hours = input.workingHours.trim();
      }
      if (input.averageWaitTime !== undefined) {
        patch.average_wait_time = input.averageWaitTime;
      }
      if (input.isActive !== undefined) patch.is_active = input.isActive;
      if (input.status !== undefined) patch.status = input.status;

      const { data, error } = await supabase
        .from('organizations')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) {
        throw new OrganizationError('not_found', 'Organization not found.');
      }
      return mapOrganizationRow(data as OrganizationRow);
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.from('organizations').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async deactivateOrganization(id: string): Promise<Organization> {
    return this.updateOrganization(id, {
      isActive: false,
      status: 'inactive',
    });
  }

  async activateOrganization(id: string): Promise<Organization> {
    return this.updateOrganization(id, {
      isActive: true,
      status: 'active',
    });
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        userId: row.user_id,
        organizationId: row.organization_id,
        role: row.role,
        createdAt: row.created_at,
      }));
    } catch (e) {
      throw toOrganizationError(e);
    }
  }

  async getMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const members = await this.listMembers(organizationId);
    return members.find((m) => m.userId === userId) ?? null;
  }

  subscribe(id: string, callback: SubscribeCallback<Organization>): Unsubscribe {
    return noopSubscribe(callback);
  }
}
