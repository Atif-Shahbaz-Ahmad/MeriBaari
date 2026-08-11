import type { Department, DepartmentIcon } from '@/domain/models';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface DepartmentListParams {
  /** When true (default for public lists), only active departments. */
  activeOnly?: boolean;
}

export interface DepartmentCreateInput {
  organizationId: string;
  name: string;
  description?: string;
  icon?: DepartmentIcon;
  isActive?: boolean;
  displayOrder?: number;
  estimatedServiceTime?: number;
}

export interface DepartmentUpdateInput {
  name?: string;
  description?: string;
  icon?: DepartmentIcon;
  isActive?: boolean;
  displayOrder?: number;
  estimatedServiceTime?: number;
  status?: Department['status'];
}

export interface DepartmentRepository {
  getById(id: string): Promise<Department | null>;
  getDepartmentById(id: string): Promise<Department | null>;
  listByOrganization(
    organizationId: string,
    params?: DepartmentListParams,
  ): Promise<Department[]>;
  getDepartmentsByOrganization(
    organizationId: string,
    params?: DepartmentListParams,
  ): Promise<Department[]>;
  create(input: DepartmentCreateInput): Promise<Department>;
  createDepartment(input: DepartmentCreateInput): Promise<Department>;
  update(id: string, input: DepartmentUpdateInput): Promise<Department>;
  updateDepartment(id: string, input: DepartmentUpdateInput): Promise<Department>;
  delete(id: string): Promise<void>;
  deleteDepartment(id: string): Promise<void>;
  deactivateDepartment(id: string): Promise<Department>;
  activateDepartment(id: string): Promise<Department>;
  subscribe(
    organizationId: string,
    callback: SubscribeCallback<Department[]>,
  ): Unsubscribe;
}
