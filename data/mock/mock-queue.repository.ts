import type { Queue } from '@/domain/models';
import type { QueueRepository, QueueUpdateInput } from '@/domain/repositories';
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
  return {
    id: q.id,
    departmentId: q.departmentId,
    currentServingNumber: q.currentServing,
    status: q.status,
    averageWaitingTime: q.averageWaitMinutes,
    serviceId: q.serviceId,
    name: q.name,
    nextNumber: q.nextNumber,
    waitingCount: q.waitingCount,
    prefix: q.prefix,
  };
}

export class MockQueueRepository implements QueueRepository {
  private overrides = new Map<string, Queue>();

  async getById(id: string): Promise<Queue | null> {
    if (this.overrides.has(id)) return this.overrides.get(id)!;
    const business = getBusinessQueueById(id);
    return business ? businessQueueToDomain(business) : null;
  }

  async listByDepartment(departmentId: string): Promise<Queue[]> {
    return MOCK_BUSINESS_QUEUES.filter((q) => q.departmentId === departmentId).map(
      businessQueueToDomain,
    );
  }

  async listBusinessQueues(): Promise<BusinessQueue[]> {
    return MOCK_BUSINESS_QUEUES.map((q) => {
      const override = this.overrides.get(q.id);
      if (!override) return { ...q };
      return {
        ...q,
        status: override.status,
        currentServing: override.currentServingNumber,
        averageWaitMinutes: override.averageWaitingTime,
        waitingCount: override.waitingCount ?? q.waitingCount,
        nextNumber: override.nextNumber ?? q.nextNumber,
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

  async update(id: string, input: QueueUpdateInput): Promise<Queue> {
    const existing = (await this.getById(id)) ?? {
      id,
      departmentId: '',
      currentServingNumber: '',
      status: 'active' as const,
      averageWaitingTime: 0,
    };
    const updated: Queue = { ...existing, ...input };
    this.overrides.set(id, updated);
    return updated;
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
