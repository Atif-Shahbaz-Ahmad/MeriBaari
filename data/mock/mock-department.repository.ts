import type { Department } from '@/domain/models';
import type {
  DepartmentCreateInput,
  DepartmentRepository,
  DepartmentUpdateInput,
} from '@/domain/repositories';
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
    const fromExtra = this.extras.find((d) => d.id === id);
    if (fromExtra) return fromExtra;
    const dept = getDepartmentById(id);
    return dept ? toDomainDepartment(dept) : null;
  }

  async listByOrganization(organizationId: string): Promise<Department[]> {
    const seeded = getDepartmentsByOrganization(organizationId).map(
      toDomainDepartment,
    );
    const extra = this.extras.filter((d) => d.organizationId === organizationId);
    return [...seeded, ...extra];
  }

  async create(input: DepartmentCreateInput): Promise<Department> {
    const department: Department = {
      id: `dept-local-${Date.now()}`,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description ?? '',
      estimatedServiceTime: input.estimatedServiceTime ?? 10,
      status: 'active',
      averageWaitMinutes: input.estimatedServiceTime ?? 10,
      estimatedQueueSize: 0,
      availability: 'open',
      icon: 'users',
      serviceIds: [],
    };
    this.extras.push(department);
    return department;
  }

  async update(id: string, input: DepartmentUpdateInput): Promise<Department> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Department not found: ${id}`);
    const updated: Department = {
      ...existing,
      ...input,
      averageWaitMinutes:
        input.estimatedServiceTime ?? existing.averageWaitMinutes,
    };
    const idx = this.extras.findIndex((d) => d.id === id);
    if (idx >= 0) this.extras[idx] = updated;
    else this.extras.push(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.extras = this.extras.filter((d) => d.id !== id);
  }

  subscribe(
    organizationId: string,
    callback: (payload: Department[]) => void,
  ) {
    return noopSubscribe(callback);
  }
}
