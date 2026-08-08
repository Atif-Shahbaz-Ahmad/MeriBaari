import type { Service } from '@/domain/models';
import type {
  ServiceCreateInput,
  ServiceRepository,
  ServiceUpdateInput,
} from '@/domain/repositories';
import {
  getServiceById,
  getServicesByDepartment,
  getServicesByIds,
  MOCK_SERVICES,
} from '@/mock/services';
import { toDomainService } from '@/data/mappers/domain-mappers';
import { noopSubscribe } from './noop-subscribe';

export class MockServiceRepository implements ServiceRepository {
  private extras: Service[] = [];

  async getById(id: string): Promise<Service | null> {
    const fromExtra = this.extras.find((s) => s.id === id);
    if (fromExtra) return fromExtra;
    const service = getServiceById(id);
    return service ? toDomainService(service) : null;
  }

  async listByDepartment(departmentId: string): Promise<Service[]> {
    const seeded = getServicesByDepartment(departmentId).map(toDomainService);
    const extra = this.extras.filter((s) => s.departmentId === departmentId);
    return [...seeded, ...extra];
  }

  async listByIds(ids: string[]): Promise<Service[]> {
    const seeded = getServicesByIds(ids).map(toDomainService);
    const extra = this.extras.filter((s) => ids.includes(s.id));
    const byId = new Map([...seeded, ...extra].map((s) => [s.id, s]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as Service[];
  }

  async create(input: ServiceCreateInput): Promise<Service> {
    const duration = input.estimatedDuration ?? 10;
    const service: Service = {
      id: `svc-local-${Date.now()}`,
      departmentId: input.departmentId,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description ?? '',
      estimatedDuration: duration,
      estimatedDurationMinutes: duration,
      status: 'active',
      averageWaitMinutes: duration,
      peopleAhead: 0,
      availability: 'open',
    };
    this.extras.push(service);
    return service;
  }

  async update(id: string, input: ServiceUpdateInput): Promise<Service> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Service not found: ${id}`);
    const updated: Service = {
      ...existing,
      ...input,
      estimatedDuration: input.estimatedDuration ?? existing.estimatedDuration,
    };
    const idx = this.extras.findIndex((s) => s.id === id);
    if (idx >= 0) this.extras[idx] = updated;
    else this.extras.push(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.extras = this.extras.filter((s) => s.id !== id);
  }

  subscribe(departmentId: string, callback: (payload: Service[]) => void) {
    return noopSubscribe(callback);
  }
}
