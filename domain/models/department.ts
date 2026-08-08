import type { AvailabilityStatus } from '@/types/organization';

/** Department status — maps to `departments.status`. */
export type DepartmentStatus = 'active' | 'inactive' | 'paused';

/**
 * Canonical department entity — maps to `departments` table.
 */
export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  estimatedServiceTime: number;
  status: DepartmentStatus;

  /** App catalog fields used by join-queue UI. */
  averageWaitMinutes: number;
  estimatedQueueSize: number;
  availability: AvailabilityStatus;
  icon:
    | 'stethoscope'
    | 'heart'
    | 'tooth'
    | 'eye'
    | 'siren'
    | 'scan'
    | 'flask'
    | 'users'
    | 'file'
    | 'car';
  serviceIds: string[];
}
