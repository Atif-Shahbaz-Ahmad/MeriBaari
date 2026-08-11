import type {
  DepartmentRepository,
  OrganizationRepository,
  ServiceCreateInput,
  ServiceListParams,
  ServiceRepository,
  ServiceUpdateInput,
} from '@/domain/repositories';
import { StructureError } from '@/domain/errors/structure-error';

export class ServiceService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly departments: DepartmentRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  getById(id: string) {
    return this.services.getServiceById(id);
  }

  getServiceById(id: string) {
    return this.services.getServiceById(id);
  }

  listByDepartment(departmentId: string, params?: ServiceListParams) {
    return this.services.getServicesByDepartment(departmentId, params);
  }

  getServicesByDepartment(departmentId: string, params?: ServiceListParams) {
    return this.services.getServicesByDepartment(departmentId, params);
  }

  listByIds(ids: string[]) {
    return this.services.listByIds(ids);
  }

  async createService(input: ServiceCreateInput) {
    const name = input.name.trim();
    if (!name) {
      throw new StructureError('invalid_data', 'Service name is required.');
    }

    const duration = input.durationMinutes ?? input.estimatedDuration ?? 10;
    if (!(duration > 0)) {
      throw new StructureError(
        'invalid_data',
        'Duration must be greater than 0 minutes.',
      );
    }
    if (input.price != null && input.price < 0) {
      throw new StructureError(
        'invalid_data',
        'Price must be zero or greater when provided.',
      );
    }

    await this.assertOwnsDepartment(input.departmentId);

    return this.services.createService({
      ...input,
      name,
      description: input.description?.trim() ?? '',
      durationMinutes: duration,
      estimatedDuration: duration,
      price: input.price ?? null,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    });
  }

  async updateService(id: string, input: ServiceUpdateInput) {
    const existing = await this.services.getServiceById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Service not found.');
    }
    await this.assertOwnsDepartment(existing.departmentId);

    if (input.name !== undefined && !input.name.trim()) {
      throw new StructureError('invalid_data', 'Service name is required.');
    }

    const duration = input.durationMinutes ?? input.estimatedDuration;
    if (duration !== undefined && !(duration > 0)) {
      throw new StructureError(
        'invalid_data',
        'Duration must be greater than 0 minutes.',
      );
    }
    if (input.price != null && input.price < 0) {
      throw new StructureError(
        'invalid_data',
        'Price must be zero or greater when provided.',
      );
    }

    return this.services.updateService(id, {
      ...input,
      name: input.name?.trim(),
      description: input.description?.trim(),
      durationMinutes: duration,
      estimatedDuration: duration,
    });
  }

  async deleteService(id: string) {
    const existing = await this.services.getServiceById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Service not found.');
    }
    await this.assertOwnsDepartment(existing.departmentId);
    return this.services.deleteService(id);
  }

  async deactivateService(id: string) {
    const existing = await this.services.getServiceById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Service not found.');
    }
    await this.assertOwnsDepartment(existing.departmentId);
    return this.services.deactivateService(id);
  }

  async activateService(id: string) {
    const existing = await this.services.getServiceById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Service not found.');
    }
    await this.assertOwnsDepartment(existing.departmentId);
    return this.services.activateService(id);
  }

  async validateDepartmentOwnership(departmentId: string): Promise<boolean> {
    const department = await this.departments.getDepartmentById(departmentId);
    if (!department) return false;
    const mine = await this.organizations.getMyOrganization();
    return Boolean(mine && mine.id === department.organizationId);
  }

  private async assertOwnsDepartment(departmentId: string) {
    const ok = await this.validateDepartmentOwnership(departmentId);
    if (!ok) {
      throw new StructureError(
        'permission_denied',
        'You can only manage services for your own organization.',
      );
    }
  }
}
