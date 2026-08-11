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

  getQueueById(id: string) {
    return this.queues.getQueueById(id);
  }

  getQueueByService(serviceId: string) {
    return this.queues.getQueueByService(serviceId);
  }

  getOrganizationQueues(organizationId: string) {
    return this.queues.getOrganizationQueues(organizationId);
  }

  listBusinessQueues(organizationId?: string) {
    return this.queues.listBusinessQueues(organizationId);
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

  createQueue(
    input: Parameters<QueueRepository['createQueue']>[0],
  ) {
    return this.queues.createQueue(input);
  }

  updateQueue(id: string, input: QueueUpdateInput) {
    return this.queues.updateQueue(id, input);
  }

  pauseQueue(id: string) {
    return this.queues.pauseQueue(id);
  }

  resumeQueue(id: string) {
    return this.queues.resumeQueue(id);
  }

  closeQueue(id: string) {
    return this.queues.closeQueue(id);
  }

  listWaitingCustomers(queueId?: string) {
    return this.entries.listWaitingCustomers(queueId);
  }

  listAllWaitingCustomers() {
    return this.entries.listAllWaitingCustomers();
  }

  getQueueEntries(queueId: string) {
    return this.entries.getQueueEntries(queueId);
  }

  getMyActiveQueueEntries() {
    return this.entries.getMyActiveQueueEntries();
  }

  callNextCustomer(queueId: string) {
    return this.entries.callNextCustomer(queueId);
  }

  startServing(entryId: string) {
    return this.entries.startServing(entryId);
  }

  serveCustomer(entryId: string) {
    return this.entries.serveCustomer(entryId);
  }

  skipCustomer(entryId: string) {
    return this.entries.skipCustomer(entryId);
  }

  cancelQueueEntry(entryId: string) {
    return this.entries.cancelQueueEntry(entryId);
  }
}
