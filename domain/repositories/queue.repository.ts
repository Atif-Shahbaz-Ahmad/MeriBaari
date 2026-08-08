import type { Queue } from '@/domain/models';
import type { BusinessQueue, BusinessQueueDetailsStats } from '@/types/business';
import type { QueueProgressDetails } from '@/types/queue';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface QueueUpdateInput {
  status?: Queue['status'];
  currentServingNumber?: string;
  averageWaitingTime?: number;
}

/**
 * Queue repository covers both customer progress views and business queue ops.
 * Business-specific shapes (`BusinessQueue`) are returned for dashboard screens
 * until a dedicated mapper layer is introduced with Supabase.
 */
export interface QueueRepository {
  getById(id: string): Promise<Queue | null>;
  listByDepartment(departmentId: string): Promise<Queue[]>;
  listBusinessQueues(): Promise<BusinessQueue[]>;
  getBusinessQueueById(id: string): Promise<BusinessQueue | null>;
  getBusinessQueueDetails(id: string): Promise<BusinessQueueDetailsStats | null>;
  getProgressByTicketId(ticketId: string): Promise<QueueProgressDetails | null>;
  getProgressSequence(ticketId: string): Promise<string[]>;
  update(id: string, input: QueueUpdateInput): Promise<Queue>;
  /** Placeholder for live queue updates (current serving, waiting count). */
  subscribe(id: string, callback: SubscribeCallback<Queue>): Unsubscribe;
  subscribeBusinessQueues(
    callback: SubscribeCallback<BusinessQueue[]>,
  ): Unsubscribe;
}
