/**
 * Customer-facing ticket status used across ticket screens.
 * Broader than raw DB ticket status to support UI states like `almost`.
 */
export type TicketStatus =
  | 'waiting'
  | 'almost'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'called'
  | 'skipped'
  | 'served';

/**
 * Canonical ticket entity — maps to enriched `tickets` table.
 */
export interface Ticket {
  id: string;
  queueEntryId: string;
  userId: string;
  queueId: string;
  organizationId: string;
  departmentId: string;
  serviceId: string;
  ticketNumber: string;
  status: TicketStatus;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  /** Alias of createdAt for QR-era callers. */
  generatedAt: string;
}

/**
 * Denormalized ticket view for customer UI.
 * Assembled from ticket + queue_entry + organization + department + service.
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
  queueEntryId?: string;
  qrCode?: string;
  queueStatus?: 'open' | 'paused' | 'closed' | 'active';
}

/** Live preview shown on confirm screen before joining. */
export interface QueueJoinPreview {
  queueId: string | null;
  queueStatus: 'open' | 'paused' | 'closed' | 'active';
  currentServing: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
  averageServiceTime: number;
  canJoin: boolean;
}
