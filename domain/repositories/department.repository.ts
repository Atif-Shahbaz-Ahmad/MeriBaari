import type { Department } from '@/domain/models';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface DepartmentCreateInput {
  organizationId: string;
  name: string;
  description?: string;
  estimatedServiceTime?: number;
}

export interface DepartmentUpdateInput {
  name?: string;
  description?: string;
  estimatedServiceTime?: number;
  status?: Department['status'];
}

export interface DepartmentRepository {
  getById(id: string): Promise<Department | null>;
  listByOrganization(organizationId: string): Promise<Department[]>;
  create(input: DepartmentCreateInput): Promise<Department>;
  update(id: string, input: DepartmentUpdateInput): Promise<Department>;
  delete(id: string): Promise<void>;
  subscribe(
    organizationId: string,
    callback: SubscribeCallback<Department[]>,
  ): Unsubscribe;
}
