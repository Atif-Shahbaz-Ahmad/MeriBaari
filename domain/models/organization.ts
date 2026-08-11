import type { OrganizationCategoryId } from '@/constants/organization-categories';
import type { AvailabilityStatus } from '@/types/organization';

/** Organization operational status — maps to `organizations.status`. */
export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

/** Canonical organization category — maps to `organizations.category`. */
export type OrganizationCategory = OrganizationCategoryId;

/**
 * Canonical organization entity — maps to `organizations` table.
 * Catalog/discovery fields (distance, rating, flags) default until
 * queues and reviews are wired.
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
