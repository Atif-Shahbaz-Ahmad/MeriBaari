import type { QueueEntry } from '@/domain/models';
import type { BusinessWaitingCustomer, WalkInDraft } from '@/types/business';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface QueueEntryCreateInput {
  queueId: string;
  customerId?: string | null;
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
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface QueueEntryRepository {
  getById(id: string): Promise<QueueEntry | null>;
  listByQueue(queueId: string): Promise<QueueEntry[]>;
  listWaitingCustomers(queueId?: string): Promise<BusinessWaitingCustomer[]>;
  listAllWaitingCustomers(): Promise<BusinessWaitingCustomer[]>;
  create(input: QueueEntryCreateInput): Promise<QueueEntry>;
  createWalkIn(draft: WalkInDraft): Promise<BusinessWaitingCustomer>;
  update(id: string, input: QueueEntryUpdateInput): Promise<QueueEntry>;
  delete(id: string): Promise<void>;
  subscribe(
    queueId: string,
    callback: SubscribeCallback<QueueEntry[]>,
  ): Unsubscribe;
}
