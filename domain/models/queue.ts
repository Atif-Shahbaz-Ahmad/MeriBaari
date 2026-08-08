/** Queue operational status — maps to `queues.status`. */
export type QueueStatus = 'active' | 'paused' | 'closed';

/**
 * Canonical queue entity — maps to `queues` table.
 * One queue typically backs a department (or service) live line.
 */
export interface Queue {
  id: string;
  departmentId: string;
  currentServingNumber: string;
  status: QueueStatus;
  averageWaitingTime: number;

  /** Optional denormalized fields used by business dashboard. */
  serviceId?: string;
  name?: string;
  nextNumber?: string;
  waitingCount?: number;
  prefix?: string;
}
