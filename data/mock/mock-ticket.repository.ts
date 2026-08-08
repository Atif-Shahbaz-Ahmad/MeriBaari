import type { QueueTicket, Ticket } from '@/domain/models';
import type {
  JoinQueueInput,
  TicketRepository,
  TicketUpdateInput,
} from '@/domain/repositories';
import type { Organization } from '@/types';
import type { TicketStatistics } from '@/types/queue';
import {
  getActiveTickets,
  getCancelledTickets,
  getCompletedTickets,
  getPrimaryActiveTicket,
  getTicketById,
  MOCK_TICKETS,
} from '@/mock/tickets';
import { getHistoryTickets } from '@/mock/history';
import { computeTicketStatistics } from '@/mock/statistics';
import { noopSubscribe } from './noop-subscribe';

function nextTicketNumber(prefix: string, existing: QueueTicket[]): string {
  const nums = existing
    .map((t) => t.ticketNumber)
    .filter((n) => n.startsWith(`${prefix}-`))
    .map((n) => Number.parseInt(n.split('-')[1] ?? '0', 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

function prefixForOrg(org: Organization): string {
  const map: Record<string, string> = {
    hospitals: 'A',
    banks: 'B',
    government: 'C',
    clinics: 'D',
    universities: 'E',
    restaurants: 'F',
    others: 'G',
  };
  return map[org.category] ?? 'Q';
}

export class MockTicketRepository implements TicketRepository {
  private tickets: QueueTicket[] = MOCK_TICKETS.map((t) => ({ ...t }));

  async getById(id: string): Promise<QueueTicket | null> {
    return this.tickets.find((t) => t.id === id) ?? getTicketById(id) ?? null;
  }

  async list(): Promise<QueueTicket[]> {
    return this.tickets.map((t) => ({ ...t }));
  }

  async listActive(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    return getActiveTickets(tickets ?? this.tickets);
  }

  async listCompleted(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    return getCompletedTickets(tickets ?? this.tickets);
  }

  async listCancelled(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    return getCancelledTickets(tickets ?? this.tickets);
  }

  async listHistory(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    return getHistoryTickets(tickets ?? this.tickets);
  }

  async getPrimaryActive(tickets?: QueueTicket[]): Promise<QueueTicket | null> {
    return getPrimaryActiveTicket(tickets ?? this.tickets) ?? null;
  }

  async joinQueue(input: JoinQueueInput): Promise<QueueTicket> {
    const { organization, department, service } = input;
    const prefix = prefixForOrg(organization);
    const ticketNumber = nextTicketNumber(prefix, this.tickets);
    const peopleAhead = service.peopleAhead;
    const estimatedWaitMinutes = service.averageWaitMinutes;
    const servingNum = Math.max(
      1,
      Number.parseInt(ticketNumber.split('-')[1] ?? '1', 10) - peopleAhead - 1,
    );
    const currentServing = `${prefix}-${String(servingNum).padStart(3, '0')}`;
    const now = Date.now();

    const ticket: QueueTicket = {
      id: `ticket-${now}`,
      ticketNumber,
      queueId: `queue-${service.id}`,
      organizationId: organization.id,
      locationName: organization.name,
      organizationName: organization.name,
      departmentId: department.id,
      departmentName: department.name,
      serviceId: service.id,
      serviceName: service.name,
      status: peopleAhead <= 1 ? 'almost' : 'waiting',
      position: peopleAhead + 1,
      peopleAhead,
      estimatedWaitMinutes,
      currentServing,
      counter: String(Math.floor(Math.random() * 6) + 1).padStart(2, '0'),
      joinedAt: new Date(now).toISOString(),
      estimatedCompletionAt: new Date(
        now + estimatedWaitMinutes * 60_000,
      ).toISOString(),
      reminderEnabled: true,
      logoIcon: organization.logoIcon,
      queueEntryId: `qe-${now}`,
      qrCode: `MB-${ticketNumber}-${now}`,
    };

    this.tickets = [ticket, ...this.tickets];
    return ticket;
  }

  async update(id: string, input: TicketUpdateInput): Promise<QueueTicket> {
    const idx = this.tickets.findIndex((t) => t.id === id);
    if (idx < 0) throw new Error(`Ticket not found: ${id}`);
    const updated = { ...this.tickets[idx], ...input };
    this.tickets[idx] = updated;
    return updated;
  }

  async cancel(id: string): Promise<QueueTicket> {
    return this.update(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      peopleAhead: 0,
      position: 0,
      estimatedWaitMinutes: 0,
    });
  }

  async getStatistics(tickets?: QueueTicket[]): Promise<TicketStatistics> {
    return computeTicketStatistics(tickets ?? this.tickets);
  }

  async getQrTicket(ticketId: string): Promise<Ticket | null> {
    const ticket = await this.getById(ticketId);
    if (!ticket) return null;
    return {
      id: `qr-${ticket.id}`,
      queueEntryId: ticket.queueEntryId ?? ticket.id,
      qrCode: ticket.qrCode ?? `MB-${ticket.ticketNumber}`,
      generatedAt: ticket.joinedAt,
    };
  }

  subscribe(userId: string, callback: (payload: QueueTicket[]) => void) {
    return noopSubscribe(callback);
  }

  /** Sync seed for Zustand stores that hydrate once at boot. */
  getSeedTickets(): QueueTicket[] {
    return this.tickets.map((t) => ({ ...t }));
  }

  /** Replace in-memory list (used when store is source of truth during session). */
  replaceAll(tickets: QueueTicket[]): void {
    this.tickets = tickets.map((t) => ({ ...t }));
  }
}
