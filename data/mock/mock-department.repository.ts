import type { Department } from '@/domain/models';
import type {
  DepartmentCreateInput,
  DepartmentListParams,
  DepartmentRepository,
  DepartmentUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import { StructureError } from '@/domain/errors/structure-error';
import {
  getDepartmentById,
  getDepartmentsByOrganization,
  MOCK_DEPARTMENTS,
} from '@/mock/departments';
import { toDomainDepartment } from '@/data/mappers/domain-mappers';
import { noopSubscribe } from './noop-subscribe';

export class MockDepartmentRepository implements DepartmentRepository {
  private extras: Department[] = [];

  private all(): Department[] {
    return [...MOCK_DEPARTMENTS.map(toDomainDepartment), ...this.extras];
  }

  async getById(id: string): Promise<Department | null> {
    return this.getDepartmentById(id);
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    const fromExtra = this.extras.find((d) => d.id === id);
    if (fromExtra) return fromExtra;
    const dept = getDepartmentById(id);
    return dept ? toDomainDepartment(dept) : null;
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
    const seeded = getDepartmentsByOrganization(organizationId).map(
      toDomainDepartment,
    );
    const extra = this.extras.filter((d) => d.organizationId === organizationId);
    const all = [...seeded, ...extra].sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );
    if (params.activeOnly) {
      return all.filter((d) => d.isActive);
    }
    return all;
  }

  async create(input: DepartmentCreateInput): Promise<Department> {
    return this.createDepartment(input);
  }

  async createDepartment(input: DepartmentCreateInput): Promise<Department> {
    const now = new Date().toISOString();
    const isActive = input.isActive ?? true;
    const department: Department = {
      id: `dept-local-${Date.now()}`,
      organizationId: input.organizationId,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      icon: input.icon ?? 'users',
      isActive,
      displayOrder: input.displayOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      estimatedServiceTime: input.estimatedServiceTime ?? 10,
      status: isActive ? 'active' : 'inactive',
      averageWaitMinutes: input.estimatedServiceTime ?? 10,
      estimatedQueueSize: 0,
      availability: isActive ? 'open' : 'closed',
      serviceIds: [],
    };
    this.extras.push(department);
    return department;
  }

  async update(id: string, input: DepartmentUpdateInput): Promise<Department> {
    return this.updateDepartment(id, input);
  }

  async updateDepartment(
    id: string,
    input: DepartmentUpdateInput,
  ): Promise<Department> {
    const existing = await this.getDepartmentById(id);
    if (!existing) {
      throw new StructureError('not_found', `Department not found: ${id}`);
    }
    const isActive =
      input.isActive !== undefined ? input.isActive : existing.isActive;
    const updated: Department = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      description: input.description?.trim() ?? existing.description,
      icon: input.icon ?? existing.icon,
      isActive,
      displayOrder: input.displayOrder ?? existing.displayOrder,
      estimatedServiceTime:
        input.estimatedServiceTime ?? existing.estimatedServiceTime,
      status: input.status ?? (isActive ? 'active' : 'inactive'),
      averageWaitMinutes:
        input.estimatedServiceTime ?? existing.averageWaitMinutes,
      availability: isActive ? 'open' : 'closed',
      updatedAt: new Date().toISOString(),
    };
    const idx = this.extras.findIndex((d) => d.id === id);
    if (idx >= 0) this.extras[idx] = updated;
    else this.extras.push(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    return this.deleteDepartment(id);
  }

  async deleteDepartment(id: string): Promise<void> {
    this.extras = this.extras.filter((d) => d.id !== id);
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

export function getMockDepartmentSeedCount(): number {
  return MOCK_DEPARTMENTS.length;
}
