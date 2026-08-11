import type { QueueEntry, QueueTicket } from '@/domain/models';
import type { BusinessWaitingCustomer, WalkInDraft } from '@/types/business';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface QueueEntryCreateInput {
  queueId: string;
  customerId?: string | null;
  userId?: string | null;
  serviceId: string;
  ticketNumber: string;
  position: number;
  customerName?: string;
  phone?: string;
  priority?: QueueEntry['priority'];
}

export interface QueueEntryUpdateInput {
  status?: QueueEntry['status'];
  position?: number;
  calledAt?: string | null;
  servedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  estimatedWaitMinutes?: number;
}

export interface JoinQueueByServiceInput {
  serviceId: string;
}

export interface CallNextResult {
  entryId: string;
  ticketId: string | null;
  ticketNumber: string;
  status: 'called';
  calledAt: string | null;
  customerId: string | null;
}

export interface QueueEntryActionResult {
  entryId: string;
  ticketId: string | null;
  ticketNumber: string;
  status: string;
  servedAt?: string | null;
  next?: CallNextResult | null;
}

export interface QueueEntryRepository {
  getById(id: string): Promise<QueueEntry | null>;
  getQueueEntryById(id: string): Promise<QueueEntry | null>;
  listByQueue(queueId: string): Promise<QueueEntry[]>;
  getQueueEntries(queueId: string): Promise<QueueEntry[]>;
  getMyActiveQueueEntries(): Promise<QueueEntry[]>;
  listWaitingCustomers(queueId?: string): Promise<BusinessWaitingCustomer[]>;
  listAllWaitingCustomers(): Promise<BusinessWaitingCustomer[]>;
  create(input: QueueEntryCreateInput): Promise<QueueEntry>;
  createWalkIn(draft: WalkInDraft): Promise<BusinessWaitingCustomer>;
  update(id: string, input: QueueEntryUpdateInput): Promise<QueueEntry>;
  delete(id: string): Promise<void>;
  joinQueue(input: JoinQueueByServiceInput): Promise<QueueTicket>;
  cancelQueueEntry(entryId: string): Promise<QueueEntry>;
  callNextCustomer(queueId: string): Promise<CallNextResult>;
  startServing(entryId: string): Promise<QueueEntryActionResult>;
  serveCustomer(entryId: string): Promise<QueueEntryActionResult>;
  skipCustomer(entryId: string): Promise<QueueEntryActionResult>;
  subscribe(
    queueId: string,
    callback: SubscribeCallback<QueueEntry[]>,
  ): Unsubscribe;
}
