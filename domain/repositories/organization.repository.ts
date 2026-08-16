import type {
  Organization,
  OrganizationMember,
  OrganizationStatus,
} from '@/domain/models';
import type { OrganizationCategory } from '@/types/organization';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface OrganizationSearchParams {
  query?: string;
  category?: OrganizationCategory | 'all';
  /** When true (default for public list), only active orgs are returned. */
  activeOnly?: boolean;
}

export interface OrganizationCreateInput {
  name: string;
  category: OrganizationCategory;
  description?: string;
  phone?: string | null;
  email?: string | null;
  address?: string;
  city?: string;
  logoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workingHours?: string;
}

export interface OrganizationUpdateInput {
  name?: string;
  category?: OrganizationCategory;
  description?: string;
  phone?: string | null;
  email?: string | null;
  address?: string;
  city?: string;
  logoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workingHours?: string;
  averageWaitTime?: number;
  isActive?: boolean;
  status?: OrganizationStatus;
}

export interface OrganizationRepository {
  getById(id: string): Promise<Organization | null>;
  /** Alias of getById — preferred name in newer call sites. */
  getOrganizationById(id: string): Promise<Organization | null>;

  /** Active organizations for public discovery. */
  list(params?: OrganizationSearchParams): Promise<Organization[]>;
  /** Alias of list. */
  getOrganizations(params?: OrganizationSearchParams): Promise<Organization[]>;

  search(params: OrganizationSearchParams): Promise<Organization[]>;

  /**
   * Lowest active service price per organization (discover price sort).
   * Uses existing `services.price` — no new schema.
   */
  getStartingPrices(
    organizationIds: string[],
  ): Promise<Record<string, number>>;

  /** Organization owned by the authenticated business user. */
  getMyOrganization(): Promise<Organization | null>;

  createOrganization(data: OrganizationCreateInput): Promise<Organization>;
  updateOrganization(
    id: string,
    data: OrganizationUpdateInput,
  ): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  deactivateOrganization(id: string): Promise<Organization>;
  activateOrganization(id: string): Promise<Organization>;

  listMembers(organizationId: string): Promise<OrganizationMember[]>;
  getMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null>;

  /** Placeholder for live org / queue count updates. */
  subscribe(id: string, callback: SubscribeCallback<Organization>): Unsubscribe;
}
