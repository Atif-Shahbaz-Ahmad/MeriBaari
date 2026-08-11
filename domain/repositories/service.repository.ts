import type { Service } from '@/domain/models';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface ServiceListParams {
  /** When true (default for public lists), only active services. */
  activeOnly?: boolean;
}

export interface ServiceCreateInput {
  departmentId: string;
  organizationId?: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  estimatedDuration?: number;
  price?: number | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface ServiceUpdateInput {
  name?: string;
  description?: string;
  durationMinutes?: number;
  estimatedDuration?: number;
  price?: number | null;
  isActive?: boolean;
  displayOrder?: number;
  status?: Service['status'];
}

export interface ServiceRepository {
  getById(id: string): Promise<Service | null>;
  getServiceById(id: string): Promise<Service | null>;
  listByDepartment(
    departmentId: string,
    params?: ServiceListParams,
  ): Promise<Service[]>;
  getServicesByDepartment(
    departmentId: string,
    params?: ServiceListParams,
  ): Promise<Service[]>;
  listByIds(ids: string[]): Promise<Service[]>;
  create(input: ServiceCreateInput): Promise<Service>;
  createService(input: ServiceCreateInput): Promise<Service>;
  update(id: string, input: ServiceUpdateInput): Promise<Service>;
  updateService(id: string, input: ServiceUpdateInput): Promise<Service>;
  delete(id: string): Promise<void>;
  deleteService(id: string): Promise<void>;
  deactivateService(id: string): Promise<Service>;
  activateService(id: string): Promise<Service>;
  subscribe(
    departmentId: string,
    callback: SubscribeCallback<Service[]>,
  ): Unsubscribe;
}
