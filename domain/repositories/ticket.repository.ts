import type { QueueTicket, Ticket } from '@/domain/models';
import type { Department, Organization, QueueService } from '@/types';
import type { TicketStatistics } from '@/types/queue';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface JoinQueueInput {
  organization: Organization;
  department: Department;
  service: QueueService;
  customerId?: string;
}

export interface TicketUpdateInput {
  status?: QueueTicket['status'];
  reminderEnabled?: boolean;
  completedAt?: string;
  cancelledAt?: string;
  peopleAhead?: number;
  position?: number;
  estimatedWaitMinutes?: number;
  actualWaitMinutes?: number;
}

/**
 * Ticket repository exposes the denormalized `QueueTicket` view used by UI.
 * Canonical `Ticket` (QR row) is available for future Supabase mapping.
 */
export interface TicketRepository {
  getById(id: string): Promise<QueueTicket | null>;
  list(): Promise<QueueTicket[]>;
  listActive(tickets?: QueueTicket[]): Promise<QueueTicket[]>;
  listCompleted(tickets?: QueueTicket[]): Promise<QueueTicket[]>;
  listCancelled(tickets?: QueueTicket[]): Promise<QueueTicket[]>;
  listHistory(tickets?: QueueTicket[]): Promise<QueueTicket[]>;
  getPrimaryActive(tickets?: QueueTicket[]): Promise<QueueTicket | null>;
  joinQueue(input: JoinQueueInput): Promise<QueueTicket>;
  update(id: string, input: TicketUpdateInput): Promise<QueueTicket>;
  cancel(id: string): Promise<QueueTicket>;
  getStatistics(tickets?: QueueTicket[]): Promise<TicketStatistics>;
  getQrTicket(ticketId: string): Promise<Ticket | null>;
  subscribe(
    userId: string,
    callback: SubscribeCallback<QueueTicket[]>,
  ): Unsubscribe;
}
