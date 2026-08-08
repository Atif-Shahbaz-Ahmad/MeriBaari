import type { QueueEntry } from '@/domain/models';
import type {
  QueueEntryCreateInput,
  QueueEntryRepository,
  QueueEntryUpdateInput,
} from '@/domain/repositories';
import type { BusinessWaitingCustomer, WalkInDraft } from '@/types/business';
import {
  getCustomersByQueueId,
  MOCK_BUSINESS_CUSTOMERS,
  WALK_IN_DEPARTMENTS,
  WALK_IN_SERVICES,
} from '@/mock/businessCustomers';
import { MOCK_BUSINESS_QUEUES } from '@/mock/businessQueues';
import { noopSubscribe } from './noop-subscribe';

function customerToEntry(c: BusinessWaitingCustomer): QueueEntry {
  return {
    id: c.id,
    queueId: c.queueId,
    customerId: null,
    serviceId: '',
    ticketNumber: c.queueNumber,
    position: 0,
    status: c.status,
    joinedAt: c.joinedAt,
    calledAt: null,
    completedAt: null,
    cancelledAt: null,
    customerName: c.customerName,
    phone: c.phone,
    priority: c.priority,
    estimatedServiceMinutes: c.estimatedServiceMinutes,
  };
}

function entryToCustomer(e: QueueEntry): BusinessWaitingCustomer {
  return {
    id: e.id,
    queueId: e.queueId,
    queueNumber: e.ticketNumber,
    customerName: e.customerName ?? 'Guest',
    phone: e.phone,
    joinedAt: e.joinedAt,
    estimatedServiceMinutes: e.estimatedServiceMinutes ?? 5,
    priority: e.priority ?? 'normal',
    status:
      e.status === 'waiting' ||
      e.status === 'called' ||
      e.status === 'serving' ||
      e.status === 'skipped'
        ? e.status
        : 'waiting',
  };
}

export class MockQueueEntryRepository implements QueueEntryRepository {
  private entries: QueueEntry[] = MOCK_BUSINESS_CUSTOMERS.map(customerToEntry);

  async getById(id: string): Promise<QueueEntry | null> {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  async listByQueue(queueId: string): Promise<QueueEntry[]> {
    return this.entries.filter((e) => e.queueId === queueId);
  }

  async listWaitingCustomers(
    queueId?: string,
  ): Promise<BusinessWaitingCustomer[]> {
    if (!queueId) return this.listAllWaitingCustomers();
    return getCustomersByQueueId(
      queueId,
      this.entries.map(entryToCustomer),
    );
  }

  async listAllWaitingCustomers(): Promise<BusinessWaitingCustomer[]> {
    return this.entries.map(entryToCustomer);
  }

  async create(input: QueueEntryCreateInput): Promise<QueueEntry> {
    const entry: QueueEntry = {
      id: `qe-${Date.now()}`,
      queueId: input.queueId,
      customerId: input.customerId ?? null,
      serviceId: input.serviceId,
      ticketNumber: input.ticketNumber,
      position: input.position,
      status: 'waiting',
      joinedAt: new Date().toISOString(),
      calledAt: null,
      completedAt: null,
      cancelledAt: null,
      customerName: input.customerName,
      phone: input.phone,
      priority: input.priority ?? 'normal',
    };
    this.entries.push(entry);
    return entry;
  }

  async createWalkIn(draft: WalkInDraft): Promise<BusinessWaitingCustomer> {
    const service = WALK_IN_SERVICES.find((s) => s.id === draft.serviceId);
    const department = WALK_IN_DEPARTMENTS.find((d) => d.id === draft.departmentId);
    const queueId = service?.queueId ?? MOCK_BUSINESS_QUEUES[0]?.id ?? '';
    const queue = MOCK_BUSINESS_QUEUES.find((q) => q.id === queueId);

    const prefix = queue?.prefix ?? 'W';
    const nums = this.entries
      .filter((e) => e.ticketNumber.startsWith(`${prefix}-`))
      .map((e) => Number.parseInt(e.ticketNumber.split('-')[1] ?? '0', 10));
    const next = (nums.length ? Math.max(...nums) : 100) + 1;
    const ticketNumber = `${prefix}-${String(next).padStart(3, '0')}`;

    const entry = await this.create({
      queueId,
      serviceId: draft.serviceId,
      ticketNumber,
      position: (queue?.waitingCount ?? 0) + 1,
      customerName: draft.customerName.trim() || 'Walk-in Guest',
      phone: draft.phone.trim() || undefined,
      priority: draft.priority,
    });

    void department;
    return entryToCustomer(entry);
  }

  async update(id: string, input: QueueEntryUpdateInput): Promise<QueueEntry> {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error(`Queue entry not found: ${id}`);
    const updated = { ...this.entries[idx], ...input };
    this.entries[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  subscribe(queueId: string, callback: (payload: QueueEntry[]) => void) {
    return noopSubscribe(callback);
  }

  getSeedCustomers(): BusinessWaitingCustomer[] {
    return this.entries.map(entryToCustomer);
  }
}
