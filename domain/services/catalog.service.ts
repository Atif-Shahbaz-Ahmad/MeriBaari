import type { CatalogRepository } from '@/domain/repositories';
import type { AuthRepository } from '@/domain/repositories';
import type { UserRole } from '@/types/auth';
import type { AuthUser } from '@/types/auth';
import {
  filterHistoryTickets,
  groupTicketsByDate,
} from '@/mock/history';
import type { QueueTicket } from '@/domain/models';

/**
 * App catalog + auth helpers + pure view utilities used by screens.
 */
export class CatalogService {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly auth: AuthRepository,
  ) {}

  getOrganizationCategories() {
    return this.catalog.getOrganizationCategories();
  }

  getLanguageOptions() {
    return this.catalog.getLanguageOptions();
  }

  getThemeOptions() {
    return this.catalog.getThemeOptions();
  }

  getDefaultPreferences() {
    return this.catalog.getDefaultPreferences();
  }

  getFaq() {
    return this.catalog.getFaq();
  }

  getAbout() {
    return this.catalog.getAbout();
  }

  getSettingsGroups() {
    return this.catalog.getSettingsGroups();
  }

  getRoleCardCopy() {
    return this.catalog.getRoleCardCopy();
  }

  getRoleDisplayLabel(role: UserRole | null | undefined) {
    return this.catalog.getRoleDisplayLabel(role);
  }

  getNearbyServiceToOrgMap() {
    return this.catalog.getNearbyServiceToOrgMap();
  }

  createDemoSession(role?: UserRole | null, overrides?: Partial<AuthUser>) {
    return this.auth.createDemoSession(role, overrides);
  }

  filterHistoryTickets(
    tickets: QueueTicket[],
    query: string,
    statusFilter: 'all' | 'completed' | 'cancelled' | 'missed',
  ) {
    return filterHistoryTickets(tickets, query, statusFilter);
  }

  groupTicketsByDate(tickets: QueueTicket[]) {
    return groupTicketsByDate(tickets);
  }
}
