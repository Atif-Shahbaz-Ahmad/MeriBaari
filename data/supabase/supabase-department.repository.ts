import type { Department } from '@/domain/models';
import type {
  DepartmentCreateInput,
  DepartmentListParams,
  DepartmentRepository,
  DepartmentUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import {
  StructureError,
  toStructureError,
} from '@/domain/errors/structure-error';
import { mapDepartmentRow } from '@/data/supabase/mappers';
import { noopSubscribe } from '@/data/mock/noop-subscribe';
import { requireSupabase } from '@/lib/supabase';
import type { DepartmentRow } from '@/supabase/types';

export class SupabaseDepartmentRepository implements DepartmentRepository {
  async getById(id: string): Promise<Department | null> {
    return this.getDepartmentById(id);
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapDepartmentRow(data as DepartmentRow) : null;
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async listByOrganization(
    organizationId: string,
    params: DepartmentListParams = {},
  ): Promise<Department[]> {
    return this.getDepartmentsByOrganization(organizationId, params);
  }

  async getDepartmentsByOrganization(
    organizationId: string,
    params: DepartmentListParams = {},
  ): Promise<Department[]> {
    const supabase = requireSupabase();
    const activeOnly = params.activeOnly ?? false;

    try {
      let builder = supabase
        .from('departments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (activeOnly) {
        builder = builder.eq('is_active', true).eq('status', 'active');
      }

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []).map((row) => mapDepartmentRow(row as DepartmentRow));
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async create(input: DepartmentCreateInput): Promise<Department> {
    return this.createDepartment(input);
  }

  async createDepartment(input: DepartmentCreateInput): Promise<Department> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          organization_id: input.organizationId,
          name: input.name.trim(),
          description: input.description?.trim() ?? '',
          icon: input.icon ?? 'users',
          is_active: input.isActive ?? true,
          display_order: input.displayOrder ?? 0,
          estimated_service_time: input.estimatedServiceTime ?? 10,
          status: (input.isActive ?? true) ? 'active' : 'inactive',
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) {
        throw new StructureError('unknown', 'Failed to create department.');
      }
      return mapDepartmentRow(data as DepartmentRow);
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async update(id: string, input: DepartmentUpdateInput): Promise<Department> {
    return this.updateDepartment(id, input);
  }

  async updateDepartment(
    id: string,
    input: DepartmentUpdateInput,
  ): Promise<Department> {
    const supabase = requireSupabase();
    try {
      const patch: {
        name?: string;
        description?: string;
        icon?: string;
        is_active?: boolean;
        display_order?: number;
        estimated_service_time?: number;
        status?: 'active' | 'inactive' | 'paused';
      } = {};

      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.description !== undefined) {
        patch.description = input.description.trim();
      }
      if (input.icon !== undefined) patch.icon = input.icon;
      if (input.isActive !== undefined) patch.is_active = input.isActive;
      if (input.displayOrder !== undefined) {
        patch.display_order = input.displayOrder;
      }
      if (input.estimatedServiceTime !== undefined) {
        patch.estimated_service_time = input.estimatedServiceTime;
      }
      if (input.status !== undefined) patch.status = input.status;

      const { data, error } = await supabase
        .from('departments')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) {
        throw new StructureError('not_found', 'Department not found.');
      }
      return mapDepartmentRow(data as DepartmentRow);
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async delete(id: string): Promise<void> {
    return this.deleteDepartment(id);
  }

  async deleteDepartment(id: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      throw toStructureError(e);
    }
  }

  async deactivateDepartment(id: string): Promise<Department> {
    return this.updateDepartment(id, { isActive: false, status: 'inactive' });
  }

  async activateDepartment(id: string): Promise<Department> {
    return this.updateDepartment(id, { isActive: true, status: 'active' });
  }

  subscribe(
    organizationId: string,
    callback: SubscribeCallback<Department[]>,
  ): Unsubscribe {
    return noopSubscribe(callback);
  }
}
