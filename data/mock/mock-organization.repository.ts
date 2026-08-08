import type { Organization, OrganizationMember } from '@/domain/models';
import type {
  OrganizationRepository,
  OrganizationSearchParams,
} from '@/domain/repositories';
import {
  getOrganizationById,
  MOCK_ORGANIZATIONS,
  searchOrganizations,
} from '@/mock/organizations';
import { toDomainOrganization } from '@/data/mappers/domain-mappers';
import { noopSubscribe } from './noop-subscribe';

const MOCK_MEMBERS: OrganizationMember[] = [
  {
    userId: 'demo-business-1',
    organizationId: 'org-city-hospital',
    role: 'owner',
    createdAt: '2025-08-01T00:00:00.000Z',
  },
];

export class MockOrganizationRepository implements OrganizationRepository {
  async getById(id: string): Promise<Organization | null> {
    const org = getOrganizationById(id);
    return org ? toDomainOrganization(org) : null;
  }

  async list(): Promise<Organization[]> {
    return MOCK_ORGANIZATIONS.map(toDomainOrganization);
  }

  async search(params: OrganizationSearchParams): Promise<Organization[]> {
    return searchOrganizations(params.query ?? '', params.category ?? 'all').map(
      toDomainOrganization,
    );
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    return MOCK_MEMBERS.filter((m) => m.organizationId === organizationId);
  }

  async getMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return (
      MOCK_MEMBERS.find(
        (m) => m.organizationId === organizationId && m.userId === userId,
      ) ?? null
    );
  }

  subscribe(id: string, callback: (payload: Organization) => void) {
    return noopSubscribe(callback);
  }
}
