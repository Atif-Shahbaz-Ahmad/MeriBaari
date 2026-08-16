import type { Organization, OrganizationMember } from '@/domain/models';
import { isOrganizationPublic } from '@/domain/models';
import type {
  OrganizationCreateInput,
  OrganizationRepository,
  OrganizationSearchParams,
  OrganizationUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import {
  OrganizationError,
} from '@/domain/errors/organization-error';
import {
  getOrganizationCategoryIcon,
  normalizeOrganizationCategory,
} from '@/constants/organization-categories';
import {
  getOrganizationById,
  MOCK_ORGANIZATIONS,
  searchOrganizations,
} from '@/mock/organizations';
import { MOCK_SERVICES } from '@/mock/services';
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

/**
 * In-memory organization repository for demos when Supabase is not configured.
 */
export class MockOrganizationRepository implements OrganizationRepository {
  private owned: Organization | null = null;
  private extras: Organization[] = [];

  async getById(id: string): Promise<Organization | null> {
    return this.getOrganizationById(id);
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    if (this.owned?.id === id) return this.owned;
    const extra = this.extras.find((o) => o.id === id);
    if (extra) return extra;
    const org = getOrganizationById(id);
    return org ? toDomainOrganization(org) : null;
  }

  async list(params: OrganizationSearchParams = {}): Promise<Organization[]> {
    return this.getOrganizations(params);
  }

  async getOrganizations(
    params: OrganizationSearchParams = {},
  ): Promise<Organization[]> {
    return this.search({ ...params, activeOnly: params.activeOnly ?? true });
  }

  async search(params: OrganizationSearchParams): Promise<Organization[]> {
    const seed = searchOrganizations(
      params.query ?? '',
      params.category ?? 'all',
    ).map(toDomainOrganization);

    const q = params.query?.trim().toLowerCase() ?? '';
    const serviceOrgIds = q
      ? new Set(
          MOCK_SERVICES.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              (s.description?.toLowerCase().includes(q) ?? false),
          ).map((s) => s.organizationId),
        )
      : null;

    const created = [...(this.owned ? [this.owned] : []), ...this.extras].filter(
      (org) => {
        if (params.activeOnly !== false) {
          if (!isOrganizationPublic(org)) return false;
        }
        if (params.category && params.category !== 'all') {
          if (org.category !== params.category) return false;
        }
        if (!q) return true;
        return (
          org.name.toLowerCase().includes(q) ||
          org.description.toLowerCase().includes(q) ||
          org.city.toLowerCase().includes(q) ||
          org.address.toLowerCase().includes(q) ||
          Boolean(serviceOrgIds?.has(org.id))
        );
      },
    );

    const byId = new Map<string, Organization>();
    for (const org of [...seed, ...created]) {
      byId.set(org.id, org);
    }

    // Include seed orgs matched only via services (searchOrganizations may miss them).
    if (serviceOrgIds) {
      for (const orgId of serviceOrgIds) {
        if (byId.has(orgId)) continue;
        const org = await this.getOrganizationById(orgId);
        if (!org) continue;
        if (params.activeOnly !== false && !isOrganizationPublic(org)) continue;
        if (
          params.category &&
          params.category !== 'all' &&
          org.category !== params.category
        ) {
          continue;
        }
        byId.set(org.id, org);
      }
    }

    return Array.from(byId.values());
  }

  async getStartingPrices(
    organizationIds: string[],
  ): Promise<Record<string, number>> {
    const wanted = new Set(organizationIds);
    const result: Record<string, number> = {};
    for (const service of MOCK_SERVICES) {
      if (!wanted.has(service.organizationId)) continue;
      const price =
        typeof service.price === 'number' ? service.price : undefined;
      if (price == null) continue;
      const current = result[service.organizationId];
      if (current == null || price < current) {
        result[service.organizationId] = price;
      }
    }
    return result;
  }

  async getMyOrganization(): Promise<Organization | null> {
    return this.owned;
  }

  async createOrganization(
    data: OrganizationCreateInput,
  ): Promise<Organization> {
    if (this.owned) {
      throw new OrganizationError(
        'duplicate',
        'You already have an organization. Edit your existing one instead.',
      );
    }

    const now = new Date().toISOString();
    const category = normalizeOrganizationCategory(data.category);
    const org: Organization = {
      id: `org-mock-${Date.now()}`,
      ownerId: 'demo-business-1',
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      logoUrl: data.logoUrl ?? null,
      logo: data.logoUrl ?? null,
      category,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address?.trim() ?? '',
      city: data.city?.trim() ?? '',
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      averageWaitTime: 0,
      isActive: false,
      status: 'inactive',
      subscriptionStatus: 'draft',
      approvedAt: null,
      approvedBy: null,
      subscriptionSubmittedAt: null,
      paymentRejectionReason: null,
      adminHidden: false,
      adminHiddenReason: null,
      adminHiddenAt: null,
      workingHours: data.workingHours?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
      averageWaitMinutes: 0,
      activeQueues: 0,
      distanceKm: 0,
      rating: 0,
      reviewCount: 0,
      currentVisitors: 0,
      averageServiceMinutes: 0,
      todaysVisitors: 0,
      liveQueueCount: 0,
      featured: false,
      popular: false,
      nearby: false,
      recentlyVisited: false,
      logoIcon: getOrganizationCategoryIcon(category),
      departmentIds: [],
      popularServiceIds: [],
    };

    this.owned = org;
    MOCK_MEMBERS.push({
      userId: 'demo-business-1',
      organizationId: org.id,
      role: 'owner',
      createdAt: now,
    });
    return org;
  }

  async updateOrganization(
    id: string,
    data: OrganizationUpdateInput,
  ): Promise<Organization> {
    const current = await this.getOrganizationById(id);
    if (!current) {
      throw new OrganizationError('not_found', 'Organization not found.');
    }
    if (this.owned?.id !== id) {
      throw new OrganizationError(
        'permission_denied',
        'You can only update your own organization.',
      );
    }

    const logoUrl =
      data.logoUrl !== undefined ? data.logoUrl : current.logoUrl;
    const category =
      data.category !== undefined
        ? normalizeOrganizationCategory(data.category)
        : current.category;
    const isActive =
      data.isActive !== undefined ? data.isActive : current.isActive;
    const status =
      data.status ??
      (isActive ? 'active' : 'inactive');

    const updated: Organization = {
      ...current,
      name: data.name?.trim() ?? current.name,
      description: data.description?.trim() ?? current.description,
      category,
      phone: data.phone !== undefined ? data.phone : current.phone,
      email: data.email !== undefined ? data.email : current.email,
      address: data.address?.trim() ?? current.address,
      city: data.city?.trim() ?? current.city,
      logoUrl,
      logo: logoUrl,
      latitude: data.latitude !== undefined ? data.latitude : current.latitude,
      longitude:
        data.longitude !== undefined ? data.longitude : current.longitude,
      workingHours: data.workingHours?.trim() ?? current.workingHours,
      averageWaitTime:
        data.averageWaitTime !== undefined
          ? data.averageWaitTime
          : current.averageWaitTime,
      averageWaitMinutes:
        data.averageWaitTime !== undefined
          ? data.averageWaitTime
          : current.averageWaitMinutes,
      isActive,
      status,
      logoIcon: getOrganizationCategoryIcon(category),
      updatedAt: new Date().toISOString(),
    };

    this.owned = updated;
    return updated;
  }

  async deleteOrganization(id: string): Promise<void> {
    if (this.owned?.id !== id) {
      throw new OrganizationError(
        'permission_denied',
        'You can only delete your own organization.',
      );
    }
    this.owned = null;
  }

  async deactivateOrganization(id: string): Promise<Organization> {
    return this.updateOrganization(id, { isActive: false, status: 'inactive' });
  }

  async activateOrganization(id: string): Promise<Organization> {
    return this.updateOrganization(id, { isActive: true, status: 'active' });
  }

  applySubscriptionStatus(
    status: Organization['subscriptionStatus'],
    extra: Partial<Organization> = {},
  ): Organization | null {
    if (!this.owned) return null;
    const now = new Date().toISOString();
    const live = status === 'active';
    this.owned = {
      ...this.owned,
      ...extra,
      subscriptionStatus: status,
      isActive: live ? true : false,
      status: live ? 'active' : 'inactive',
      updatedAt: now,
    };
    return this.owned;
  }

  applyAdminVisibility(
    organizationId: string,
    visible: boolean,
    reason?: string,
  ): Organization | null {
    if (!this.owned || this.owned.id !== organizationId) return null;
    const now = new Date().toISOString();
    this.owned = {
      ...this.owned,
      adminHidden: !visible,
      adminHiddenReason: visible ? null : reason?.trim() || null,
      adminHiddenAt: visible ? null : now,
      updatedAt: now,
    };
    return this.owned;
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

  subscribe(id: string, callback: SubscribeCallback<Organization>): Unsubscribe {
    return noopSubscribe(callback);
  }
}

/** Expose seed count for tests / diagnostics. */
export function getMockOrganizationSeedCount(): number {
  return MOCK_ORGANIZATIONS.length;
}
