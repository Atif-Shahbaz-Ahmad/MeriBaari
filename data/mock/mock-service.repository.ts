import type { Service } from '@/domain/models';
import type {
  ServiceCreateInput,
  ServiceListParams,
  ServiceRepository,
  ServiceUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import { StructureError } from '@/domain/errors/structure-error';
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
    return this.getServiceById(id);
  }

  async getServiceById(id: string): Promise<Service | null> {
    const fromExtra = this.extras.find((s) => s.id === id);
    if (fromExtra) return fromExtra;
    const service = getServiceById(id);
    return service ? toDomainService(service) : null;
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
    const seeded = getServicesByDepartment(departmentId).map(toDomainService);
    const extra = this.extras.filter((s) => s.departmentId === departmentId);
    const all = [...seeded, ...extra].sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );
    if (params.activeOnly) {
      return all.filter((s) => s.isActive);
    }
    return all;
  }

  async listByIds(ids: string[]): Promise<Service[]> {
    const seeded = getServicesByIds(ids).map(toDomainService);
    const extra = this.extras.filter((s) => ids.includes(s.id));
    const byId = new Map([...seeded, ...extra].map((s) => [s.id, s]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as Service[];
  }

  async create(input: ServiceCreateInput): Promise<Service> {
    return this.createService(input);
  }

  async createService(input: ServiceCreateInput): Promise<Service> {
    const duration = input.durationMinutes ?? input.estimatedDuration ?? 10;
    const now = new Date().toISOString();
    const isActive = input.isActive ?? true;
    const service: Service = {
      id: `svc-local-${Date.now()}`,
      departmentId: input.departmentId,
      organizationId: input.organizationId ?? '',
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      durationMinutes: duration,
      estimatedDuration: duration,
      estimatedDurationMinutes: duration,
      price: input.price ?? null,
      isActive,
      displayOrder: input.displayOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      status: isActive ? 'active' : 'inactive',
      averageWaitMinutes: duration,
      peopleAhead: 0,
      availability: isActive ? 'open' : 'closed',
    };
    this.extras.push(service);
    return service;
  }

  async update(id: string, input: ServiceUpdateInput): Promise<Service> {
    return this.updateService(id, input);
  }

  async updateService(id: string, input: ServiceUpdateInput): Promise<Service> {
    const existing = await this.getServiceById(id);
    if (!existing) {
      throw new StructureError('not_found', `Service not found: ${id}`);
    }
    const duration =
      input.durationMinutes ??
      input.estimatedDuration ??
      existing.durationMinutes;
    const isActive =
      input.isActive !== undefined ? input.isActive : existing.isActive;
    const updated: Service = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      description: input.description?.trim() ?? existing.description,
      durationMinutes: duration,
      estimatedDuration: duration,
      estimatedDurationMinutes: duration,
      price: input.price !== undefined ? input.price : existing.price,
      isActive,
      displayOrder: input.displayOrder ?? existing.displayOrder,
      status: input.status ?? (isActive ? 'active' : 'inactive'),
      averageWaitMinutes: duration,
      availability: isActive ? 'open' : 'closed',
      updatedAt: new Date().toISOString(),
    };
    const idx = this.extras.findIndex((s) => s.id === id);
    if (idx >= 0) this.extras[idx] = updated;
    else this.extras.push(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    return this.deleteService(id);
  }

  async deleteService(id: string): Promise<void> {
    this.extras = this.extras.filter((s) => s.id !== id);
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

export function getMockServiceSeedCount(): number {
  return MOCK_SERVICES.length;
}
