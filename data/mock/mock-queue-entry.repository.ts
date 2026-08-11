import type { QueueEntry, QueueTicket } from '@/domain/models';
import type {
  CallNextResult,
  JoinQueueByServiceInput,
  QueueEntryActionResult,
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
  const now = c.joinedAt;
  return {
    id: c.id,
    queueId: c.queueId,
    userId: null,
    customerId: null,
    serviceId: '',
    ticketNumber: c.queueNumber,
    position: 0,
    status: c.status,
    joinedAt: c.joinedAt,
    calledAt: null,
    servedAt: null,
    completedAt: null,
    cancelledAt: null,
    estimatedWaitMinutes: c.estimatedServiceMinutes,
    createdAt: now,
    updatedAt: now,
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
    return this.getQueueEntryById(id);
  }

  async getQueueEntryById(id: string): Promise<QueueEntry | null> {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  async listByQueue(queueId: string): Promise<QueueEntry[]> {
    return this.getQueueEntries(queueId);
  }

  async getQueueEntries(queueId: string): Promise<QueueEntry[]> {
    return this.entries.filter((e) => e.queueId === queueId);
  }

  async getMyActiveQueueEntries(): Promise<QueueEntry[]> {
    return this.entries.filter(
      (e) =>
        e.status === 'waiting' ||
        e.status === 'called' ||
        e.status === 'serving',
    );
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
    const now = new Date().toISOString();
    const entry: QueueEntry = {
      id: `qe-${Date.now()}`,
      queueId: input.queueId,
      userId: input.userId ?? input.customerId ?? null,
      customerId: input.customerId ?? input.userId ?? null,
      serviceId: input.serviceId,
      ticketNumber: input.ticketNumber,
      position: input.position,
      status: 'waiting',
      joinedAt: now,
      calledAt: null,
      servedAt: null,
      completedAt: null,
      cancelledAt: null,
      estimatedWaitMinutes: 0,
      createdAt: now,
      updatedAt: now,
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
    const updated = {
      ...this.entries[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.entries[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  async joinQueue(input: JoinQueueByServiceInput): Promise<QueueTicket> {
    const now = new Date().toISOString();
    return {
      id: `ticket-${Date.now()}`,
      ticketNumber: 'A001',
      queueId: `queue-${input.serviceId}`,
      organizationId: '',
      locationName: '',
      organizationName: '',
      departmentId: '',
      departmentName: '',
      serviceId: input.serviceId,
      serviceName: '',
      status: 'waiting',
      position: 1,
      peopleAhead: 0,
      estimatedWaitMinutes: 0,
      currentServing: '—',
      joinedAt: now,
      reminderEnabled: true,
    };
  }

  async cancelQueueEntry(entryId: string): Promise<QueueEntry> {
    return this.update(entryId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });
  }

  async callNextCustomer(queueId: string): Promise<CallNextResult> {
    const waiting = this.entries
      .filter((e) => e.queueId === queueId && e.status === 'waiting')
      .sort(
        (a, b) =>
          new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
      );
    const next = waiting[0];
    if (!next) throw new Error('NO_CUSTOMERS_WAITING');
    const updated = await this.update(next.id, {
      status: 'called',
      calledAt: new Date().toISOString(),
    });
    return {
      entryId: updated.id,
      ticketId: null,
      ticketNumber: updated.ticketNumber,
      status: 'called',
      calledAt: updated.calledAt,
      customerId: updated.customerId,
    };
  }

  async startServing(entryId: string): Promise<QueueEntryActionResult> {
    const updated = await this.update(entryId, { status: 'serving' });
    return {
      entryId: updated.id,
      ticketId: null,
      ticketNumber: updated.ticketNumber,
      status: 'serving',
    };
  }

  async serveCustomer(entryId: string): Promise<QueueEntryActionResult> {
    const now = new Date().toISOString();
    const updated = await this.update(entryId, {
      status: 'served',
      servedAt: now,
      completedAt: now,
    });
    return {
      entryId: updated.id,
      ticketId: null,
      ticketNumber: updated.ticketNumber,
      status: 'served',
      servedAt: now,
    };
  }

  async skipCustomer(entryId: string): Promise<QueueEntryActionResult> {
    const updated = await this.update(entryId, { status: 'skipped' });
    return {
      entryId: updated.id,
      ticketId: null,
      ticketNumber: updated.ticketNumber,
      status: 'skipped',
    };
  }

  subscribe(queueId: string, callback: (payload: QueueEntry[]) => void) {
    return noopSubscribe(callback);
  }

  getSeedCustomers(): BusinessWaitingCustomer[] {
    return this.entries.map(entryToCustomer);
  }
}
