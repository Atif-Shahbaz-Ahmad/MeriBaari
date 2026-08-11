/** Lifecycle status for a person standing in a queue. */
export type QueueEntryStatus =
  | 'waiting'
  | 'called'
  | 'serving'
  | 'served'
  | 'skipped'
  | 'cancelled'
  /** Legacy DB values still accepted when reading. */
  | 'completed'
  | 'missed';

/**
 * Canonical queue entry — maps to `queue_entries` table.
 * `userId` maps to `customer_id` in the database.
 */
export interface QueueEntry {
  id: string;
  queueId: string;
  userId: string | null;
  /** Alias of userId for legacy callers. */
  customerId: string | null;
  serviceId: string;
  ticketNumber: string;
  position: number;
  status: QueueEntryStatus;
  joinedAt: string;
  calledAt: string | null;
  servedAt: string | null;
  /** Alias of servedAt for legacy callers. */
  completedAt: string | null;
  cancelledAt: string | null;
  estimatedWaitMinutes: number;
  createdAt: string;
  updatedAt: string;

  /** Optional display fields for business waiting list. */
  customerName?: string;
  phone?: string;
  priority?: 'normal' | 'priority' | 'urgent';
  estimatedServiceMinutes?: number;
}
