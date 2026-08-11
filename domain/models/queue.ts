/** Queue operational status — maps to `queues.status` (`active` in DB = open). */
export type QueueStatus = 'open' | 'paused' | 'closed';

/**
 * Canonical queue entity — maps to `queues` table.
 * One open/paused queue per service.
 */
export interface Queue {
  id: string;
  organizationId: string;
  departmentId: string;
  serviceId: string;
  status: QueueStatus;
  /** Currently called / serving ticket number display. */
  currentNumber: string;
  /** Alias used by older UI / business dashboard. */
  currentServingNumber: string;
  /** Next sequence integer (not yet issued). */
  nextNumber: number;
  /** Average minutes per customer. */
  averageServiceTime: number;
  /** Alias of averageServiceTime for legacy callers. */
  averageWaitingTime: number;
  totalWaiting: number;
  prefix: string;
  createdAt: string;
  updatedAt: string;

  /** Optional denormalized fields used by business dashboard. */
  name?: string;
  waitingCount?: number;
}
