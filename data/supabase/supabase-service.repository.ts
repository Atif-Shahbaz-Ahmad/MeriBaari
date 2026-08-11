import type { Service } from '@/domain/models';
import type {
  ServiceCreateInput,
  ServiceListParams,
  ServiceRepository,
  ServiceUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import {
  StructureError,
  toStructureError,
} from '@/domain/errors/structure-error';
import { mapServiceRow } from '@/data/supabase/mappers';
import { noopSubscribe } from '@/data/mock/noop-subscribe';
import { requireSupabase } from '@/lib/supabase';
import type { ServiceRow } from '@/supabase/types';

type ServiceRowWithDepartment = ServiceRow & {
  departments?: { organization_id: string } | null;
};

export class SupabaseServiceRepository implements ServiceRepository {
  async getById(id: string): Promise<Service | null> {
    return this.getServiceById(id);
  }

  async getServiceById(id: string): Promise<Service | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, departments(organization_id)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as ServiceRowWithDepartment;
      return mapServiceRow(row, row.departments?.organization_id ?? '');
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async listByDepartment(
    departmentId: string,
    params: ServiceListParams = {},
  ): Promise<Service[]> {
    return this.getServicesByDepartment(departmentId, params);
  }

  async getServicesByDepartment(
    departmentId: string,
    params: ServiceListParams = {},
  ): Promise<Service[]> {
    const supabase = requireSupabase();
    const activeOnly = params.activeOnly ?? false;

    try {
      let builder = supabase
        .from('services')
        .select('*, departments(organization_id)')
        .eq('department_id', departmentId)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (activeOnly) {
        builder = builder.eq('is_active', true).eq('status', 'active');
      }

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []).map((item) => {
        const row = item as ServiceRowWithDepartment;
        return mapServiceRow(row, row.departments?.organization_id ?? '');
      });
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async listByIds(ids: string[]): Promise<Service[]> {
    if (ids.length === 0) return [];
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, departments(organization_id)')
        .in('id', ids);
      if (error) throw error;
      const mapped = (data ?? []).map((item) => {
        const row = item as ServiceRowWithDepartment;
        return mapServiceRow(row, row.departments?.organization_id ?? '');
      });
      const byId = new Map(mapped.map((s) => [s.id, s]));
      return ids.map((id) => byId.get(id)).filter(Boolean) as Service[];
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async create(input: ServiceCreateInput): Promise<Service> {
    return this.createService(input);
  }

  async createService(input: ServiceCreateInput): Promise<Service> {
    const supabase = requireSupabase();
    const duration = input.durationMinutes ?? input.estimatedDuration ?? 10;
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          department_id: input.departmentId,
          name: input.name.trim(),
          description: input.description?.trim() ?? '',
          estimated_duration: duration,
          price: input.price ?? null,
          is_active: input.isActive ?? true,
          display_order: input.displayOrder ?? 0,
          status: (input.isActive ?? true) ? 'active' : 'inactive',
        })
        .select('*, departments(organization_id)')
        .single();

      if (error) throw error;
      if (!data) {
        throw new StructureError('unknown', 'Failed to create service.');
      }
      const row = data as ServiceRowWithDepartment;
      return mapServiceRow(
        row,
        row.departments?.organization_id ?? input.organizationId ?? '',
      );
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async update(id: string, input: ServiceUpdateInput): Promise<Service> {
    return this.updateService(id, input);
  }

  async updateService(id: string, input: ServiceUpdateInput): Promise<Service> {
    const supabase = requireSupabase();
    try {
      const patch: {
        name?: string;
        description?: string;
        estimated_duration?: number;
        price?: number | null;
        is_active?: boolean;
        display_order?: number;
        status?: 'active' | 'inactive' | 'paused';
      } = {};

      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.description !== undefined) {
        patch.description = input.description.trim();
      }
      const duration = input.durationMinutes ?? input.estimatedDuration;
      if (duration !== undefined) patch.estimated_duration = duration;
      if (input.price !== undefined) patch.price = input.price;
      if (input.isActive !== undefined) patch.is_active = input.isActive;
      if (input.displayOrder !== undefined) {
        patch.display_order = input.displayOrder;
      }
      if (input.status !== undefined) patch.status = input.status;

      const { data, error } = await supabase
        .from('services')
        .update(patch)
        .eq('id', id)
        .select('*, departments(organization_id)')
        .single();

      if (error) throw error;
      if (!data) {
        throw new StructureError('not_found', 'Service not found.');
      }
      const row = data as ServiceRowWithDepartment;
      return mapServiceRow(row, row.departments?.organization_id ?? '');
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async delete(id: string): Promise<void> {
    return this.deleteService(id);
  }

  async deleteService(id: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async deactivateService(id: string): Promise<Service> {
    return this.updateService(id, { isActive: false, status: 'inactive' });
  }

  async activateService(id: string): Promise<Service> {
    return this.updateService(id, { isActive: true, status: 'active' });
  }

  subscribe(
    departmentId: string,
    callback: SubscribeCallback<Service[]>,
  ): Unsubscribe {
    return noopSubscribe(callback);
  }
}
