import type {
  OrganizationCreateInput,
  OrganizationRepository,
  OrganizationSearchParams,
  OrganizationUpdateInput,
} from '@/domain/repositories';
import type { FileStorageService } from '@/domain/future';
import type { OrganizationCategory } from '@/types/organization';
import { OrganizationError } from '@/domain/errors/organization-error';

export class OrganizationService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly files?: FileStorageService,
  ) {}

  getById(id: string) {
    return this.organizations.getOrganizationById(id);
  }

  getOrganizationById(id: string) {
    return this.organizations.getOrganizationById(id);
  }

  list(params?: OrganizationSearchParams) {
    return this.organizations.getOrganizations(params);
  }

  getOrganizations(params?: OrganizationSearchParams) {
    return this.organizations.getOrganizations(params);
  }

  search(
    query: string,
    category: OrganizationCategory | 'all' = 'all',
    options?: { activeOnly?: boolean },
  ) {
    const params: OrganizationSearchParams = {
      query,
      category,
      activeOnly: options?.activeOnly ?? true,
    };
    return this.organizations.search(params);
  }

  getStartingPrices(organizationIds: string[]) {
    return this.organizations.getStartingPrices(organizationIds);
  }

  getMyOrganization() {
    return this.organizations.getMyOrganization();
  }

  async createOrganization(data: OrganizationCreateInput) {
    const name = data.name.trim();
    if (!name) {
      throw new OrganizationError('invalid_data', 'Organization name is required.');
    }
    if (!data.category) {
      throw new OrganizationError('invalid_data', 'Category is required.');
    }

    const existing = await this.organizations.getMyOrganization();
    if (existing) {
      throw new OrganizationError(
        'duplicate',
        'You already have an organization. Edit your existing one instead.',
      );
    }

    return this.organizations.createOrganization({
      ...data,
      name,
      description: data.description?.trim() ?? '',
      address: data.address?.trim() ?? '',
      city: data.city?.trim() ?? '',
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      logoUrl: data.logoUrl ?? null,
    });
  }

  async updateOrganization(id: string, data: OrganizationUpdateInput) {
    if (!id) {
      throw new OrganizationError('invalid_data', 'Organization id is required.');
    }

    const mine = await this.organizations.getMyOrganization();
    if (!mine || mine.id !== id) {
      throw new OrganizationError(
        'permission_denied',
        'You can only update your own organization.',
      );
    }

    return this.organizations.updateOrganization(id, data);
  }

  async deactivateOrganization(id: string) {
    const mine = await this.organizations.getMyOrganization();
    if (!mine || mine.id !== id) {
      throw new OrganizationError(
        'permission_denied',
        'You can only deactivate your own organization.',
      );
    }
    return this.organizations.deactivateOrganization(id);
  }

  async activateOrganization(id: string) {
    const mine = await this.organizations.getMyOrganization();
    if (!mine || mine.id !== id) {
      throw new OrganizationError(
        'permission_denied',
        'You can only activate your own organization.',
      );
    }
    return this.organizations.activateOrganization(id);
  }

  async deleteOrganization(id: string) {
    const mine = await this.organizations.getMyOrganization();
    if (!mine || mine.id !== id) {
      throw new OrganizationError(
        'permission_denied',
        'You can only delete your own organization.',
      );
    }
    return this.organizations.deleteOrganization(id);
  }

  /**
   * Optimize + upload logo, then persist `organizations.logo_url`.
   * Owners only — scoped via getMyOrganization + storage RLS.
   */
  async uploadLogo(organizationId: string, localUri: string) {
    if (!this.files) {
      throw new OrganizationError(
        'not_configured',
        'Logo upload is not available yet.',
      );
    }
    const mine = await this.organizations.getMyOrganization();
    if (!mine || mine.id !== organizationId) {
      throw new OrganizationError(
        'permission_denied',
        'You can only update your own organization logo.',
      );
    }

    const publicUrl = await this.files.uploadOrganizationLogo(
      organizationId,
      localUri,
    );
    return this.organizations.updateOrganization(organizationId, {
      logoUrl: publicUrl,
    });
  }

  /** Remove storage object (if any) and clear `organizations.logo_url`. */
  async removeLogo(organizationId: string) {
    const mine = await this.organizations.getMyOrganization();
    if (!mine || mine.id !== organizationId) {
      throw new OrganizationError(
        'permission_denied',
        'You can only update your own organization logo.',
      );
    }

    if (this.files) {
      await this.files.removeOrganizationLogo(organizationId, mine.logoUrl);
    }

    return this.organizations.updateOrganization(organizationId, {
      logoUrl: null,
    });
  }

  /** True when the current user owns the given organization. */
  async validateOwnership(organizationId: string): Promise<boolean> {
    const mine = await this.organizations.getMyOrganization();
    return Boolean(mine && mine.id === organizationId);
  }

  listMembers(organizationId: string) {
    return this.organizations.listMembers(organizationId);
  }

  getMember(organizationId: string, userId: string) {
    return this.organizations.getMember(organizationId, userId);
  }
}
