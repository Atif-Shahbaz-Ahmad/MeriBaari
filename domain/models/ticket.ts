/**
 * Customer-facing ticket status used across ticket screens.
 * Broader than raw queue-entry status to support UI states like `almost`.
 */
export type TicketStatus =
  | 'waiting'
  | 'almost'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'called';

/**
 * Canonical ticket entity — maps to `tickets` table (QR wrapper).
 * `QueueTicket` below is the denormalized view the app screens use today.
 */
export interface Ticket {
  id: string;
  queueEntryId: string;
  qrCode: string;
  generatedAt: string;
}

/**
 * Denormalized ticket view for customer UI.
 * Assembled from ticket + queue_entry + organization + department + service.
 * Kept stable so screens stay unchanged while data access moves behind repos.
 */
export interface QueueTicket {
  id: string;
  ticketNumber: string;
  queueId: string;
  organizationId: string;
  /** Display name — kept as `locationName` for Home QueueCard compatibility */
  locationName: string;
  organizationName: string;
  departmentId: string;
  departmentName: string;
  serviceId: string;
  serviceName: string;
  status: TicketStatus;
  position: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  currentServing: string;
  counter?: string;
  joinedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  estimatedCompletionAt?: string;
  reminderEnabled: boolean;
  actualWaitMinutes?: number;
  logoIcon?:
    | 'hospital'
    | 'bank'
    | 'building'
    | 'clinic'
    | 'university'
    | 'utensils'
    | 'landmark'
    | 'car';
  /** Optional link to underlying queue_entry / tickets.qr_code when wired. */
  queueEntryId?: string;
  qrCode?: string;
}
