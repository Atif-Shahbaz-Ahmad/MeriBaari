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
  /** Denormalized from parent department for convenience. */
  organizationId: string;
  name: string;
  description: string;
  /** Maps to `services.estimated_duration`. */
  durationMinutes: number;
  /** Alias of durationMinutes. */
  estimatedDuration: number;
  /** Alias for join-queue UI. */
  estimatedDurationMinutes: number;
  /** Nullable — some businesses omit pricing. */
  price: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  status: ServiceStatus;

  /** Live queue snapshot fields for join-queue UI (defaults until queues ship). */
  averageWaitMinutes: number;
  peopleAhead: number;
  availability: AvailabilityStatus;
}

/** Alias kept for screens that import QueueService as a data type. */
export type QueueServiceEntity = Service;
