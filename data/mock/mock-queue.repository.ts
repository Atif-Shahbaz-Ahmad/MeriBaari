import type { Queue } from '@/domain/models';
import type {
  QueueCreateInput,
  QueueRepository,
  QueueUpdateInput,
} from '@/domain/repositories';
import type { BusinessQueue, BusinessQueueDetailsStats } from '@/types/business';
import type { QueueProgressDetails } from '@/types/queue';
import {
  getBusinessQueueById,
  getBusinessQueueDetails,
  MOCK_BUSINESS_QUEUES,
} from '@/mock/businessQueues';
import {
  getProgressSequence,
  getQueueProgress,
} from '@/mock/queue';
import { noopSubscribe } from './noop-subscribe';

function businessQueueToDomain(q: BusinessQueue): Queue {
  const nextNum = Number.parseInt(q.nextNumber.split('-').pop() ?? '1', 10) || 1;
  return {
    id: q.id,
    organizationId: '',
    departmentId: q.departmentId,
    serviceId: q.serviceId,
    status: q.status === 'active' ? 'open' : q.status,
    currentNumber: q.currentServing,
    currentServingNumber: q.currentServing,
    nextNumber: nextNum,
    averageServiceTime: q.averageWaitMinutes,
    averageWaitingTime: q.averageWaitMinutes,
    totalWaiting: q.waitingCount,
    prefix: q.prefix,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: q.name,
    waitingCount: q.waitingCount,
  };
}

export class MockQueueRepository implements QueueRepository {
  private overrides = new Map<string, Queue>();

  async getById(id: string): Promise<Queue | null> {
    return this.getQueueById(id);
  }

  async getQueueById(id: string): Promise<Queue | null> {
    if (this.overrides.has(id)) return this.overrides.get(id)!;
    const business = getBusinessQueueById(id);
    return business ? businessQueueToDomain(business) : null;
  }

  async getQueueByService(serviceId: string): Promise<Queue | null> {
    const found = MOCK_BUSINESS_QUEUES.find((q) => q.serviceId === serviceId);
    return found ? businessQueueToDomain(found) : null;
  }

  async getOrganizationQueues(_organizationId: string): Promise<Queue[]> {
    return MOCK_BUSINESS_QUEUES.map(businessQueueToDomain);
  }

  async listByDepartment(departmentId: string): Promise<Queue[]> {
    return MOCK_BUSINESS_QUEUES.filter((q) => q.departmentId === departmentId).map(
      businessQueueToDomain,
    );
  }

  async listBusinessQueues(_organizationId?: string): Promise<BusinessQueue[]> {
    return MOCK_BUSINESS_QUEUES.map((q) => {
      const override = this.overrides.get(q.id);
      if (!override) return { ...q };
      return {
        ...q,
        status:
          override.status === 'open'
            ? 'active'
            : (override.status as BusinessQueue['status']),
        currentServing: override.currentServingNumber,
        averageWaitMinutes: override.averageWaitingTime,
        waitingCount: override.waitingCount ?? q.waitingCount,
        nextNumber: override.nextNumber
          ? `${override.prefix}${String(override.nextNumber).padStart(3, '0')}`
          : q.nextNumber,
      };
    });
  }

  async getBusinessQueueById(id: string): Promise<BusinessQueue | null> {
    const queues = await this.listBusinessQueues();
    return queues.find((q) => q.id === id) ?? null;
  }

  async getBusinessQueueDetails(
    id: string,
  ): Promise<BusinessQueueDetailsStats | null> {
    return getBusinessQueueDetails(id) ?? null;
  }

  async getProgressByTicketId(
    ticketId: string,
  ): Promise<QueueProgressDetails | null> {
    return getQueueProgress(ticketId) ?? null;
  }

  async getProgressSequence(ticketId: string): Promise<string[]> {
    return getProgressSequence(ticketId);
  }

  async createQueue(input: QueueCreateInput): Promise<Queue> {
    const queue: Queue = {
      id: `queue-${Date.now()}`,
      organizationId: input.organizationId,
      departmentId: input.departmentId,
      serviceId: input.serviceId,
      status: input.status ?? 'open',
      currentNumber: '',
      currentServingNumber: '',
      nextNumber: 1,
      averageServiceTime: input.averageServiceTime ?? 10,
      averageWaitingTime: input.averageServiceTime ?? 10,
      totalWaiting: 0,
      prefix: input.prefix ?? 'A',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.overrides.set(queue.id, queue);
    return queue;
  }

  async update(id: string, input: QueueUpdateInput): Promise<Queue> {
    return this.updateQueue(id, input);
  }

  async updateQueue(id: string, input: QueueUpdateInput): Promise<Queue> {
    const existing = (await this.getById(id)) ?? {
      id,
      organizationId: '',
      departmentId: '',
      serviceId: '',
      currentNumber: '',
      currentServingNumber: '',
      status: 'open' as const,
      nextNumber: 1,
      averageServiceTime: 10,
      averageWaitingTime: 10,
      totalWaiting: 0,
      prefix: 'A',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated: Queue = {
      ...existing,
      ...input,
      currentNumber:
        input.currentNumber ??
        input.currentServingNumber ??
        existing.currentNumber,
      currentServingNumber:
        input.currentServingNumber ??
        input.currentNumber ??
        existing.currentServingNumber,
      averageServiceTime:
        input.averageServiceTime ??
        input.averageWaitingTime ??
        existing.averageServiceTime,
      averageWaitingTime:
        input.averageWaitingTime ??
        input.averageServiceTime ??
        existing.averageWaitingTime,
      updatedAt: new Date().toISOString(),
    };
    this.overrides.set(id, updated);
    return updated;
  }

  async pauseQueue(id: string): Promise<Queue> {
    return this.updateQueue(id, { status: 'paused' });
  }

  async resumeQueue(id: string): Promise<Queue> {
    return this.updateQueue(id, { status: 'open' });
  }

  async closeQueue(id: string): Promise<Queue> {
    return this.updateQueue(id, { status: 'closed' });
  }

  subscribe(id: string, callback: (payload: Queue) => void) {
    return noopSubscribe(callback);
  }

  subscribeBusinessQueues(callback: (payload: BusinessQueue[]) => void) {
    return noopSubscribe(callback);
  }

  getSeedBusinessQueues(): BusinessQueue[] {
    return MOCK_BUSINESS_QUEUES.map((q) => ({ ...q }));
  }
}
