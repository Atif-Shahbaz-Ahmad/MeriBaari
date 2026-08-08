import type { Service } from '@/domain/models';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface ServiceCreateInput {
  departmentId: string;
  organizationId: string;
  name: string;
  description?: string;
  estimatedDuration?: number;
}

export interface ServiceUpdateInput {
  name?: string;
  description?: string;
  estimatedDuration?: number;
  status?: Service['status'];
}

export interface ServiceRepository {
  getById(id: string): Promise<Service | null>;
  listByDepartment(departmentId: string): Promise<Service[]>;
  listByIds(ids: string[]): Promise<Service[]>;
  create(input: ServiceCreateInput): Promise<Service>;
  update(id: string, input: ServiceUpdateInput): Promise<Service>;
  delete(id: string): Promise<void>;
  subscribe(
    departmentId: string,
    callback: SubscribeCallback<Service[]>,
  ): Unsubscribe;
}
