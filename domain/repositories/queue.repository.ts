import type { Queue } from '@/domain/models';
import type { BusinessQueue, BusinessQueueDetailsStats } from '@/types/business';
import type { QueueProgressDetails } from '@/types/queue';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface QueueCreateInput {
  organizationId: string;
  departmentId: string;
  serviceId: string;
  averageServiceTime?: number;
  prefix?: string;
  status?: Queue['status'];
}

export interface QueueUpdateInput {
  status?: Queue['status'];
  currentNumber?: string;
  currentServingNumber?: string;
  averageServiceTime?: number;
  averageWaitingTime?: number;
  totalWaiting?: number;
}

/**
 * Queue repository covers customer progress views and business queue ops.
 */
export interface QueueRepository {
  getById(id: string): Promise<Queue | null>;
  getQueueById(id: string): Promise<Queue | null>;
  getQueueByService(serviceId: string): Promise<Queue | null>;
  getOrganizationQueues(organizationId: string): Promise<Queue[]>;
  listByDepartment(departmentId: string): Promise<Queue[]>;
  listBusinessQueues(organizationId?: string): Promise<BusinessQueue[]>;
  getBusinessQueueById(id: string): Promise<BusinessQueue | null>;
  getBusinessQueueDetails(id: string): Promise<BusinessQueueDetailsStats | null>;
  getProgressByTicketId(ticketId: string): Promise<QueueProgressDetails | null>;
  getProgressSequence(ticketId: string): Promise<string[]>;
  createQueue(input: QueueCreateInput): Promise<Queue>;
  update(id: string, input: QueueUpdateInput): Promise<Queue>;
  updateQueue(id: string, input: QueueUpdateInput): Promise<Queue>;
  pauseQueue(id: string): Promise<Queue>;
  resumeQueue(id: string): Promise<Queue>;
  closeQueue(id: string): Promise<Queue>;
  /** Prefer RealtimeService / useQueueRealtime hooks for live updates. */
  subscribe(id: string, callback: SubscribeCallback<Queue>): Unsubscribe;
  subscribeBusinessQueues(
    callback: SubscribeCallback<BusinessQueue[]>,
  ): Unsubscribe;
}
