import type { DepartmentRepository } from '@/domain/repositories';
import type { ServiceRepository } from '@/domain/repositories';

/**
 * Coordinates organization structure: departments + services.
 */
export class OrganizationStructureService {
  constructor(
    private readonly departments: DepartmentRepository,
    private readonly services: ServiceRepository,
  ) {}

  getDepartment(id: string) {
    return this.departments.getById(id);
  }

  listDepartments(organizationId: string) {
    return this.departments.listByOrganization(organizationId);
  }

  getService(id: string) {
    return this.services.getById(id);
  }

  listServicesByDepartment(departmentId: string) {
    return this.services.listByDepartment(departmentId);
  }

  listServicesByIds(ids: string[]) {
    return this.services.listByIds(ids);
  }
}
