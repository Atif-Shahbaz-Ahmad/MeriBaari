import type { OrganizationCategoryId } from '@/constants/organization-categories';
import type { AvailabilityStatus } from '@/types/organization';

/** Organization operational status — maps to `organizations.status`. */
export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

/** Business subscription / customer-visibility state. */
export type SubscriptionStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_approval'
  | 'active'
  | 'rejected';

/** Canonical organization category — maps to `organizations.category`. */
export type OrganizationCategory = OrganizationCategoryId;

/**
 * Canonical organization entity — maps to `organizations` table.
 * Catalog/discovery fields (distance, rating, flags) default until
 * queues are live; rating/reviewCount come from the reviews aggregate.
 */
export interface Organization {
  id: string;
  ownerId: string | null;
  name: string;
  description: string;
  /** Public logo URL (never a local device path). */
  logoUrl: string | null;
  /** Alias of logoUrl for older UI that still reads `logo`. */
  logo: string | null;
  category: OrganizationCategory;
  phone: string | null;
  email: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  /** Average wait in minutes — maps to `average_wait_time`. */
  averageWaitTime: number;
  isActive: boolean;
  status: OrganizationStatus;
  subscriptionStatus: SubscriptionStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  subscriptionSubmittedAt: string | null;
  paymentRejectionReason: string | null;
  adminHidden: boolean;
  adminHiddenReason: string | null;
  adminHiddenAt: string | null;
  workingHours: string;
  createdAt: string;
  updatedAt: string;

  /** App catalog / discovery fields (defaults until live metrics exist). */
  averageWaitMinutes: number;
  activeQueues: number;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  currentVisitors: number;
  averageServiceMinutes: number;
  todaysVisitors: number;
  liveQueueCount: number;
  featured: boolean;
  popular: boolean;
  nearby: boolean;
  recentlyVisited: boolean;
  logoIcon:
    | 'hospital'
    | 'bank'
    | 'building'
    | 'clinic'
    | 'university'
    | 'utensils'
    | 'landmark'
    | 'car';
  departmentIds: string[];
  popularServiceIds: string[];
}

/** Organization membership — maps to `organization_members`. */
export type OrganizationMemberRole = 'owner' | 'manager' | 'staff' | 'viewer';

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: OrganizationMemberRole;
  createdAt?: string;
}

export type { AvailabilityStatus };

/** Customers may discover an organization only when it is approved, operational, and not hidden by admin. */
export function isOrganizationPublic(org: Pick<
  Organization,
  'subscriptionStatus' | 'isActive' | 'status' | 'adminHidden'
>): boolean {
  return (
    org.subscriptionStatus === 'active' &&
    org.isActive &&
    org.status === 'active' &&
    !org.adminHidden
  );
}

export function isSubscriptionLive(
  status: SubscriptionStatus | null | undefined,
): boolean {
  return status === 'active';
}
