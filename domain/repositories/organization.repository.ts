import type { Organization, OrganizationMember } from '@/domain/models';
import type { OrganizationCategory } from '@/types/organization';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface OrganizationSearchParams {
  query?: string;
  category?: OrganizationCategory | 'all';
}

export interface OrganizationRepository {
  getById(id: string): Promise<Organization | null>;
  list(): Promise<Organization[]>;
  search(params: OrganizationSearchParams): Promise<Organization[]>;
  listMembers(organizationId: string): Promise<OrganizationMember[]>;
  getMember(organizationId: string, userId: string): Promise<OrganizationMember | null>;
  /** Placeholder for live org / queue count updates. */
  subscribe(id: string, callback: SubscribeCallback<Organization>): Unsubscribe;
}
