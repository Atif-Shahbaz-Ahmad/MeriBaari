import type {
  AvailabilityStatus,
  OrganizationCategory,
} from '@/types/organization';

/** Organization operational status — maps to `organizations.status`. */
export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

/**
 * Canonical organization entity — maps to `organizations` table.
 * Extra catalog fields (distance, rating, flags) support discovery UI
 * and will be computed or stored as metadata when Supabase is wired.
 */
export interface Organization {
  id: string;
  name: string;
  logo: string | null;
  description: string;
  category: OrganizationCategory;
  address: string;
  phone: string | null;
  email: string | null;
  workingHours: string;
  status: OrganizationStatus;

  /** App catalog / discovery fields (not all are first-class DB columns yet). */
  city: string;
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

export type { AvailabilityStatus, OrganizationCategory };
