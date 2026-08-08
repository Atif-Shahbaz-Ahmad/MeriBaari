export type OrganizationCategory =
  | 'hospitals'
  | 'banks'
  | 'government'
  | 'clinics'
  | 'universities'
  | 'restaurants'
  | 'others';

export type AvailabilityStatus = 'open' | 'busy' | 'closed';

export interface OrganizationCategoryMeta {
  id: OrganizationCategory | 'all';
  label: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  category: OrganizationCategory;
  address: string;
  city: string;
  workingHours: string;
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
  /** Lucide-style icon key for logo placeholder */
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

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  averageWaitMinutes: number;
  estimatedQueueSize: number;
  availability: AvailabilityStatus;
  icon: 'stethoscope' | 'heart' | 'tooth' | 'eye' | 'siren' | 'scan' | 'flask' | 'users' | 'file' | 'car';
  serviceIds: string[];
}

export interface QueueService {
  id: string;
  departmentId: string;
  organizationId: string;
  name: string;
  description: string;
  estimatedDurationMinutes: number;
  averageWaitMinutes: number;
  peopleAhead: number;
  availability: AvailabilityStatus;
}
