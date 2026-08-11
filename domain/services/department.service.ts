import type {
  DepartmentCreateInput,
  DepartmentListParams,
  DepartmentRepository,
  DepartmentUpdateInput,
  OrganizationRepository,
} from '@/domain/repositories';
import { StructureError } from '@/domain/errors/structure-error';

/**
 * Business / customer department operations.
 * Ownership is validated in the service layer; RLS is the hard guarantee.
 */
export class DepartmentService {
  constructor(
    private readonly departments: DepartmentRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  getById(id: string) {
    return this.departments.getDepartmentById(id);
  }

  getDepartmentById(id: string) {
    return this.departments.getDepartmentById(id);
  }

  listByOrganization(organizationId: string, params?: DepartmentListParams) {
    return this.departments.getDepartmentsByOrganization(organizationId, params);
  }

  getDepartmentsByOrganization(
    organizationId: string,
    params?: DepartmentListParams,
  ) {
    return this.departments.getDepartmentsByOrganization(organizationId, params);
  }

  async createDepartment(input: DepartmentCreateInput) {
    const name = input.name.trim();
    if (!name) {
      throw new StructureError('invalid_data', 'Department name is required.');
    }
    await this.assertOwnsOrganization(input.organizationId);

    return this.departments.createDepartment({
      ...input,
      name,
      description: input.description?.trim() ?? '',
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    });
  }

  async updateDepartment(id: string, input: DepartmentUpdateInput) {
    const existing = await this.departments.getDepartmentById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Department not found.');
    }
    await this.assertOwnsOrganization(existing.organizationId);

    if (input.name !== undefined && !input.name.trim()) {
      throw new StructureError('invalid_data', 'Department name is required.');
    }

    return this.departments.updateDepartment(id, {
      ...input,
      name: input.name?.trim(),
      description: input.description?.trim(),
    });
  }

  async deleteDepartment(id: string) {
    const existing = await this.departments.getDepartmentById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Department not found.');
    }
    await this.assertOwnsOrganization(existing.organizationId);
    return this.departments.deleteDepartment(id);
  }

  async deactivateDepartment(id: string) {
    const existing = await this.departments.getDepartmentById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Department not found.');
    }
    await this.assertOwnsOrganization(existing.organizationId);
    return this.departments.deactivateDepartment(id);
  }

  async activateDepartment(id: string) {
    const existing = await this.departments.getDepartmentById(id);
    if (!existing) {
      throw new StructureError('not_found', 'Department not found.');
    }
    await this.assertOwnsOrganization(existing.organizationId);
    return this.departments.activateDepartment(id);
  }

  async validateOrganizationOwnership(organizationId: string): Promise<boolean> {
    const mine = await this.organizations.getMyOrganization();
    return Boolean(mine && mine.id === organizationId);
  }

  private async assertOwnsOrganization(organizationId: string) {
    const ok = await this.validateOrganizationOwnership(organizationId);
    if (!ok) {
      throw new StructureError(
        'permission_denied',
        'You can only manage departments for your own organization.',
      );
    }
  }
}
