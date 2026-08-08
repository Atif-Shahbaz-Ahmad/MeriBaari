import type { QueueRepository } from '@/domain/repositories';
import type { QueueEntryRepository } from '@/domain/repositories';
import type { QueueUpdateInput } from '@/domain/repositories';

export class QueueService {
  constructor(
    private readonly queues: QueueRepository,
    private readonly entries: QueueEntryRepository,
  ) {}

  getById(id: string) {
    return this.queues.getById(id);
  }

  listBusinessQueues() {
    return this.queues.listBusinessQueues();
  }

  getBusinessQueue(id: string) {
    return this.queues.getBusinessQueueById(id);
  }

  getBusinessQueueDetails(id: string) {
    return this.queues.getBusinessQueueDetails(id);
  }

  getProgressByTicketId(ticketId: string) {
    return this.queues.getProgressByTicketId(ticketId);
  }

  getProgressSequence(ticketId: string) {
    return this.queues.getProgressSequence(ticketId);
  }

  updateQueue(id: string, input: QueueUpdateInput) {
    return this.queues.update(id, input);
  }

  listWaitingCustomers(queueId?: string) {
    return this.entries.listWaitingCustomers(queueId);
  }

  listAllWaitingCustomers() {
    return this.entries.listAllWaitingCustomers();
  }
}
