/** Lifecycle status for a person standing in a queue. */
export type QueueEntryStatus =
  | 'waiting'
  | 'called'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'skipped'
  | 'missed';

/**
 * Canonical queue entry — maps to `queue_entries` table.
 * Represents one customer's place in a queue (before ticket QR wrap).
 */
export interface QueueEntry {
  id: string;
  queueId: string;
  customerId: string | null;
  serviceId: string;
  ticketNumber: string;
  position: number;
  status: QueueEntryStatus;
  joinedAt: string;
  calledAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;

  /** Optional display fields for business waiting list. */
  customerName?: string;
  phone?: string;
  priority?: 'normal' | 'priority' | 'urgent';
  estimatedServiceMinutes?: number;
}
