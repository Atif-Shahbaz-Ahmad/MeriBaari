import type { AvailabilityStatus } from '@/types/organization';

/** Service status — maps to `services.status`. */
export type ServiceStatus = 'active' | 'inactive' | 'paused';

/**
 * Canonical service entity — maps to `services` table.
 * Named `Service` in domain; UI historically used `QueueService`.
 */
export interface Service {
  id: string;
  departmentId: string;
  organizationId: string;
  name: string;
  description: string;
  /** Maps to `services.estimated_duration`. */
  estimatedDuration: number;
  /**
   * Alias for join-queue UI which historically used `estimatedDurationMinutes`.
   * Kept in sync with `estimatedDuration` by mappers/repositories.
   */
  estimatedDurationMinutes: number;
  status: ServiceStatus;

  /** Live queue snapshot fields for join-queue UI. */
  averageWaitMinutes: number;
  peopleAhead: number;
  availability: AvailabilityStatus;
}

/** Alias kept for screens that import QueueService as a data type. */
export type QueueServiceEntity = Service;
