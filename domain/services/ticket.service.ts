import type { TicketRepository, JoinQueueInput } from '@/domain/repositories';
import type { QueueTicket } from '@/domain/models';
import type { TicketStatus } from '@/domain/models';
import { isActiveStatus } from '@/mock/tickets';

export class TicketService {
  constructor(private readonly tickets: TicketRepository) {}

  getById(id: string) {
    return this.tickets.getById(id);
  }

  list() {
    return this.tickets.list();
  }

  listActive(tickets?: QueueTicket[]) {
    return this.tickets.listActive(tickets);
  }

  listCompleted(tickets?: QueueTicket[]) {
    return this.tickets.listCompleted(tickets);
  }

  listCancelled(tickets?: QueueTicket[]) {
    return this.tickets.listCancelled(tickets);
  }

  listHistory(tickets?: QueueTicket[]) {
    return this.tickets.listHistory(tickets);
  }

  getPrimaryActive(tickets?: QueueTicket[]) {
    return this.tickets.getPrimaryActive(tickets);
  }

  joinQueue(input: JoinQueueInput) {
    return this.tickets.joinQueue(input);
  }

  setReminder(id: string, enabled: boolean) {
    return this.tickets.update(id, { reminderEnabled: enabled });
  }

  cancel(id: string) {
    return this.tickets.cancel(id);
  }

  async updateStatus(id: string, status: TicketStatus) {
    const ticket = await this.tickets.getById(id);
    if (!ticket) throw new Error(`Ticket not found: ${id}`);

    const patch: Parameters<TicketRepository['update']>[1] = { status };

    if (status === 'completed') {
      patch.completedAt = new Date().toISOString();
      patch.peopleAhead = 0;
      patch.position = 0;
      patch.estimatedWaitMinutes = 0;
      patch.actualWaitMinutes = Math.max(
        1,
        Math.round(
          (Date.now() - new Date(ticket.joinedAt).getTime()) / 60_000,
        ),
      );
    }

    if (status === 'cancelled' || status === 'missed') {
      patch.cancelledAt = new Date().toISOString();
      patch.peopleAhead = 0;
      patch.position = 0;
      patch.estimatedWaitMinutes = 0;
    }

    return this.tickets.update(id, patch);
  }

  getStatistics(tickets?: QueueTicket[]) {
    return this.tickets.getStatistics(tickets);
  }

  getQrTicket(ticketId: string) {
    return this.tickets.getQrTicket(ticketId);
  }

  isActiveStatus(status: TicketStatus) {
    return isActiveStatus(status);
  }
}
