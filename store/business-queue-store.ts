import { create } from 'zustand';

import { dataAccess, getContainer } from '@/data';
import type {
  BusinessActivityItem,
  BusinessActivityType,
  BusinessQueue,
  BusinessQueueStatus,
  BusinessWaitingCustomer,
  WalkInDraft,
  WalkInResult,
} from '@/types';

const WALK_IN_DEPARTMENTS = dataAccess.WALK_IN_DEPARTMENTS;
const WALK_IN_SERVICES = dataAccess.WALK_IN_SERVICES;

const seedContainer = getContainer();
const SEED_QUEUES = seedContainer.mockQueueRepository.getSeedBusinessQueues();
const SEED_CUSTOMERS = seedContainer.mockQueueEntryRepository.getSeedCustomers();
const SEED_ACTIVITY = seedContainer.mockBusinessSettingsRepository.getSeedActivity();

interface BusinessQueueState {
  queues: BusinessQueue[];
  customers: BusinessWaitingCustomer[];
  activity: BusinessActivityItem[];
  selectedQueueId: string;
  lastWalkIn: WalkInResult | null;
  selectQueue: (queueId: string) => void;
  setQueueStatus: (queueId: string, status: BusinessQueueStatus) => void;
  callNext: (queueId?: string) => BusinessWaitingCustomer | null;
  callCustomer: (customerId: string) => void;
  skipCustomer: (customerId: string) => void;
  recallCustomer: (customerId: string) => void;
  markComplete: (customerId: string) => void;
  cancelTicket: (customerId: string) => void;
  addWalkIn: (draft: WalkInDraft) => WalkInResult;
  clearLastWalkIn: () => void;
  getSelectedQueue: () => BusinessQueue | undefined;
  getWaitingCustomers: (queueId?: string) => BusinessWaitingCustomer[];
}

function pushActivity(
  activity: BusinessActivityItem[],
  partial: Omit<BusinessActivityItem, 'id' | 'timestamp'> & { timestamp?: string },
): BusinessActivityItem[] {
  const item: BusinessActivityItem = {
    id: `ba-live-${Date.now()}`,
    timestamp: partial.timestamp ?? new Date().toISOString(),
    ...partial,
  };
  return [item, ...activity];
}

function bumpNumber(ticket: string, prefix: string): string {
  const num = Number.parseInt(ticket.split('-')[1] ?? '0', 10);
  return `${prefix}-${String(num + 1).padStart(3, '0')}`;
}

function nextWalkInNumber(prefix: string, customers: BusinessWaitingCustomer[], queues: BusinessQueue[]): string {
  const fromCustomers = customers
    .filter((c) => c.queueNumber.startsWith(`${prefix}-`))
    .map((c) => Number.parseInt(c.queueNumber.split('-')[1] ?? '0', 10));
  const fromQueues = queues
    .filter((q) => q.prefix === prefix)
    .flatMap((q) => [
      Number.parseInt(q.currentServing.split('-')[1] ?? '0', 10),
      Number.parseInt(q.nextNumber.split('-')[1] ?? '0', 10),
    ]);
  const max = Math.max(0, ...fromCustomers, ...fromQueues);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export const useBusinessQueueStore = create<BusinessQueueState>((set, get) => ({
  queues: SEED_QUEUES.map((q) => ({ ...q })),
  customers: SEED_CUSTOMERS.map((c) => ({ ...c })),
  activity: SEED_ACTIVITY.map((a) => ({ ...a })),
  selectedQueueId: SEED_QUEUES[0]?.id ?? '',
  lastWalkIn: null,

  selectQueue: (queueId) => set({ selectedQueueId: queueId }),

  getSelectedQueue: () => get().queues.find((q) => q.id === get().selectedQueueId),

  getWaitingCustomers: (queueId) => {
    const id = queueId ?? get().selectedQueueId;
    return get()
      .customers.filter(
        (c) =>
          c.queueId === id &&
          (c.status === 'waiting' || c.status === 'called' || c.status === 'serving'),
      )
      .sort((a, b) => {
        const rank = (status: BusinessWaitingCustomer['status']) =>
          status === 'serving' ? 0 : status === 'called' ? 1 : 2;
        const rankDiff = rank(a.status) - rank(b.status);
        if (rankDiff !== 0) return rankDiff;
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      });
  },

  setQueueStatus: (queueId, status) => {
    const queue = get().queues.find((q) => q.id === queueId);
    if (!queue) return;

    const type: BusinessActivityType = status === 'paused' ? 'paused' : 'resumed';
    set((state) => ({
      queues: state.queues.map((q) => (q.id === queueId ? { ...q, status } : q)),
      activity: pushActivity(state.activity, {
        queueId,
        queueName: queue.name,
        type,
        title: status === 'paused' ? 'Paused Queue' : 'Resumed Queue',
        subtitle:
          status === 'paused'
            ? `${queue.name} is temporarily paused`
            : `${queue.name} is accepting customers again`,
      }),
    }));
  },

  callNext: (queueId) => {
    const id = queueId ?? get().selectedQueueId;
    const waiting = get().getWaitingCustomers(id);
    const next = waiting.find((c) => c.status === 'waiting') ?? waiting[0];
    if (!next) return null;
    get().callCustomer(next.id);
    return next;
  },

  callCustomer: (customerId) => {
    const customer = get().customers.find((c) => c.id === customerId);
    const queue = customer ? get().queues.find((q) => q.id === customer.queueId) : undefined;
    if (!customer || !queue || queue.status === 'paused' || queue.status === 'closed') return;

    const wasWaiting = customer.status === 'waiting';

    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, status: 'serving' as const } : c,
      ),
      queues: state.queues.map((q) =>
        q.id === customer.queueId
          ? {
              ...q,
              currentServing: customer.queueNumber,
              nextNumber: bumpNumber(customer.queueNumber, q.prefix),
              waitingCount: wasWaiting ? Math.max(0, q.waitingCount - 1) : q.waitingCount,
            }
          : q,
      ),
      activity: pushActivity(state.activity, {
        queueId: queue.id,
        queueName: queue.name,
        type: 'called',
        title: `Called ${customer.queueNumber}`,
        subtitle: `${customer.customerName} is now being served`,
        ticketNumber: customer.queueNumber,
      }),
    }));
  },

  skipCustomer: (customerId) => {
    const customer = get().customers.find((c) => c.id === customerId);
    const queue = customer ? get().queues.find((q) => q.id === customer.queueId) : undefined;
    if (!customer || !queue) return;

    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, status: 'skipped' as const } : c,
      ),
      queues: state.queues.map((q) =>
        q.id === customer.queueId
          ? { ...q, waitingCount: Math.max(0, q.waitingCount - 1) }
          : q,
      ),
      activity: pushActivity(state.activity, {
        queueId: queue.id,
        queueName: queue.name,
        type: 'skipped',
        title: `Skipped ${customer.queueNumber}`,
        subtitle: `${customer.customerName} was skipped`,
        ticketNumber: customer.queueNumber,
      }),
    }));
  },

  recallCustomer: (customerId) => {
    const customer = get().customers.find((c) => c.id === customerId);
    const queue = customer ? get().queues.find((q) => q.id === customer.queueId) : undefined;
    if (!customer || !queue) return;

    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, status: 'called' as const } : c,
      ),
      activity: pushActivity(state.activity, {
        queueId: queue.id,
        queueName: queue.name,
        type: 'recalled',
        title: `Recalled ${customer.queueNumber}`,
        subtitle: `${customer.customerName} was recalled to the counter`,
        ticketNumber: customer.queueNumber,
      }),
    }));
  },

  markComplete: (customerId) => {
    const customer = get().customers.find((c) => c.id === customerId);
    const queue = customer ? get().queues.find((q) => q.id === customer.queueId) : undefined;
    if (!customer || !queue) return;

    set((state) => ({
      customers: state.customers.filter((c) => c.id !== customerId),
      queues: state.queues.map((q) =>
        q.id === customer.queueId
          ? {
              ...q,
              waitingCount: Math.max(
                0,
                customer.status === 'serving' ? q.waitingCount : q.waitingCount - 1,
              ),
            }
          : q,
      ),
      activity: pushActivity(state.activity, {
        queueId: queue.id,
        queueName: queue.name,
        type: 'completed',
        title: `Completed ${customer.queueNumber}`,
        subtitle: `${customer.customerName} service marked complete`,
        ticketNumber: customer.queueNumber,
      }),
    }));
  },

  cancelTicket: (customerId) => {
    const customer = get().customers.find((c) => c.id === customerId);
    const queue = customer ? get().queues.find((q) => q.id === customer.queueId) : undefined;
    if (!customer || !queue) return;

    set((state) => ({
      customers: state.customers.filter((c) => c.id !== customerId),
      queues: state.queues.map((q) =>
        q.id === customer.queueId
          ? { ...q, waitingCount: Math.max(0, q.waitingCount - 1) }
          : q,
      ),
      activity: pushActivity(state.activity, {
        queueId: queue.id,
        queueName: queue.name,
        type: 'cancelled',
        title: `Cancelled ${customer.queueNumber}`,
        subtitle: `${customer.customerName} ticket cancelled`,
        ticketNumber: customer.queueNumber,
      }),
    }));
  },

  addWalkIn: (draft) => {
    const service = WALK_IN_SERVICES.find((s) => s.id === draft.serviceId);
    const department = WALK_IN_DEPARTMENTS.find((d) => d.id === draft.departmentId);
    const queueId = service?.queueId ?? get().selectedQueueId;
    const queue = get().queues.find((q) => q.id === queueId) ?? get().queues[0];
    if (!queue) {
      throw new Error('No queue available for walk-in');
    }

    const ticketNumber = nextWalkInNumber(queue.prefix, get().customers, get().queues);
    const name = draft.customerName.trim() || 'Walk-in Guest';
    const customer: BusinessWaitingCustomer = {
      id: `bc-walkin-${Date.now()}`,
      queueId: queue.id,
      queueNumber: ticketNumber,
      customerName: name,
      phone: draft.phone.trim() || undefined,
      joinedAt: new Date().toISOString(),
      estimatedServiceMinutes: queue.averageWaitMinutes,
      priority: draft.priority,
      status: 'waiting',
    };

    const result: WalkInResult = {
      ticketNumber,
      queueId: queue.id,
      queueName: queue.name,
      departmentName:
        draft.departmentName?.trim() ||
        department?.name ||
        queue.departmentName,
      serviceName:
        draft.serviceName?.trim() || service?.name || queue.serviceName,
      estimatedWaitMinutes: queue.estimatedWaitMinutes,
      position: queue.waitingCount + 1,
    };

    set((state) => ({
      customers: [...state.customers, customer],
      queues: state.queues.map((q) =>
        q.id === queue.id
          ? {
              ...q,
              waitingCount: q.waitingCount + 1,
              nextNumber: q.waitingCount === 0 ? ticketNumber : q.nextNumber,
            }
          : q,
      ),
      activity: pushActivity(state.activity, {
        queueId: queue.id,
        queueName: queue.name,
        type: 'walk_in',
        title: `Walk-in ${ticketNumber}`,
        subtitle: `${name} added to ${queue.name}`,
        ticketNumber,
      }),
      lastWalkIn: result,
      selectedQueueId: queue.id,
    }));

    return result;
  },

  clearLastWalkIn: () => set({ lastWalkIn: null }),
}));
