/**
 * Sync presentation data access.
 *
 * UI imports from here instead of `@/mock`.
 * Implementations read through the same seed data as mock repositories.
 * Prefer `container.*Service` async APIs for new features.
 */
import type { Organization, Department, Service, QueueTicket } from '@/domain/models';
import type { OrganizationCategory } from '@/types/organization';
import type { AppNotification, NotificationCategory, UserPreferences } from '@/types/profile';
import type { UserRole } from '@/types/auth';
import type { QueueProgressDetails, TicketStatistics } from '@/types/queue';
import type { BusinessQueueDetailsStats } from '@/types/business';
import {
  toDomainDepartment,
  toDomainOrganization,
  toDomainService,
} from '@/data/mappers/domain-mappers';

// Seed modules — only referenced from the data layer, never from UI.
import { ROLE_CARD_COPY } from '@/mock/auth';
import {
  getActivityByQueueId,
  getRecentActivity,
  MOCK_BUSINESS_ACTIVITY,
} from '@/mock/businessActivity';
import {
  WALK_IN_DEPARTMENTS,
  WALK_IN_PRIORITIES,
  WALK_IN_SERVICES,
} from '@/mock/businessCustomers';
import {
  formatBusinessDate,
  getBusinessGreeting,
  MOCK_BUSINESS_DASHBOARD_STATS,
  MOCK_BUSINESS_ORG,
  MOCK_BUSINESS_QUICK_ACTIONS,
} from '@/mock/businessDashboard';
import { getBusinessQueueDetails } from '@/mock/businessQueues';
import { ORGANIZATION_CATEGORIES } from '@/mock/categories';
import {
  getDepartmentById,
  getDepartmentsByOrganization,
} from '@/mock/departments';
import { MOCK_ABOUT, MOCK_FAQ } from '@/mock/faq';
import {
  filterHistoryTickets,
  getHistoryTickets,
  groupTicketsByDate,
} from '@/mock/history';
import {
  filterNotificationsByCategory,
  groupNotificationsByDay,
} from '@/mock/notifications';
import {
  getOrganizationById,
  NEARBY_SERVICE_TO_ORG,
  searchOrganizations,
} from '@/mock/organizations';
import {
  DEFAULT_PREFERENCES,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
} from '@/mock/preferences';
import {
  getRoleDisplayLabel,
  MOCK_BUSINESS_PROFILE_STATS,
  MOCK_PROFILE_STATS,
} from '@/mock/profile';
import { getProgressSequence, getQueueProgress } from '@/mock/queue';
import {
  getServiceById,
  getServicesByDepartment,
  getServicesByIds,
} from '@/mock/services';
import { SETTINGS_GROUPS } from '@/mock/settings';
import { computeTicketStatistics } from '@/mock/statistics';
import {
  getActiveTickets,
  getCancelledTickets,
  getCompletedTickets,
  getPrimaryActiveTicket,
  isActiveStatus,
} from '@/mock/tickets';

export const dataAccess = {
  // Organizations
  getOrganizationById(id: string): Organization | undefined {
    const org = getOrganizationById(id);
    return org ? toDomainOrganization(org) : undefined;
  },
  searchOrganizations(
    query: string,
    category: OrganizationCategory | 'all' = 'all',
  ): Organization[] {
    return searchOrganizations(query, category).map(toDomainOrganization);
  },
  NEARBY_SERVICE_TO_ORG,

  // Departments
  getDepartmentById(id: string): Department | undefined {
    const d = getDepartmentById(id);
    return d ? toDomainDepartment(d) : undefined;
  },
  getDepartmentsByOrganization(organizationId: string): Department[] {
    return getDepartmentsByOrganization(organizationId).map(toDomainDepartment);
  },

  // Services
  getServiceById(id: string): Service | undefined {
    const s = getServiceById(id);
    return s ? toDomainService(s) : undefined;
  },
  getServicesByDepartment(departmentId: string): Service[] {
    return getServicesByDepartment(departmentId).map(toDomainService);
  },
  getServicesByIds(ids: string[]): Service[] {
    return getServicesByIds(ids).map(toDomainService);
  },

  // Tickets
  getActiveTickets,
  getCompletedTickets,
  getCancelledTickets,
  getPrimaryActiveTicket,
  getHistoryTickets,
  filterHistoryTickets,
  groupTicketsByDate,
  isActiveStatus,
  computeTicketStatistics(tickets?: QueueTicket[]): TicketStatistics {
    return computeTicketStatistics(tickets);
  },

  // Queue
  getQueueProgress(ticketId: string): QueueProgressDetails | undefined {
    return getQueueProgress(ticketId);
  },
  getProgressSequence,
  getBusinessQueueDetails(id: string): BusinessQueueDetailsStats | undefined {
    return getBusinessQueueDetails(id);
  },

  // Notifications
  filterNotificationsByCategory(
    notifications: AppNotification[],
    category: NotificationCategory | 'all',
  ) {
    return filterNotificationsByCategory(notifications, category);
  },
  groupNotificationsByDay,

  // Business
  getBusinessGreeting,
  formatBusinessDate,
  getRecentActivity,
  getActivityByQueueId,
  MOCK_BUSINESS_ACTIVITY,
  MOCK_BUSINESS_DASHBOARD_STATS,
  MOCK_BUSINESS_ORG,
  MOCK_BUSINESS_QUICK_ACTIONS,

  // Catalog
  ORGANIZATION_CATEGORIES,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  DEFAULT_PREFERENCES: DEFAULT_PREFERENCES as UserPreferences,
  MOCK_FAQ,
  MOCK_ABOUT,
  SETTINGS_GROUPS,
  ROLE_CARD_COPY,
  MOCK_PROFILE_STATS,
  MOCK_BUSINESS_PROFILE_STATS,
  WALK_IN_DEPARTMENTS,
  WALK_IN_SERVICES,
  WALK_IN_PRIORITIES,
  getRoleDisplayLabel(role: UserRole | null | undefined) {
    return getRoleDisplayLabel(role);
  },
};
