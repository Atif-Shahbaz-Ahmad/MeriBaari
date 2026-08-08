import type { OrganizationRepository } from '@/domain/repositories';
import type { OrganizationSearchParams } from '@/domain/repositories';
import type { OrganizationCategory } from '@/types/organization';

export class OrganizationService {
  constructor(private readonly organizations: OrganizationRepository) {}

  getById(id: string) {
    return this.organizations.getById(id);
  }

  list() {
    return this.organizations.list();
  }

  search(query: string, category: OrganizationCategory | 'all' = 'all') {
    const params: OrganizationSearchParams = { query, category };
    return this.organizations.search(params);
  }

  listMembers(organizationId: string) {
    return this.organizations.listMembers(organizationId);
  }

  getMember(organizationId: string, userId: string) {
    return this.organizations.getMember(organizationId, userId);
  }
}
