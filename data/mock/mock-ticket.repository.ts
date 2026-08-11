import type { QueueJoinPreview, QueueTicket, Ticket } from '@/domain/models';
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
  MOCK_TICKETS,
} from '@/mock/tickets';
import { getHistoryTickets } from '@/mock/history';
import { computeTicketStatistics } from '@/mock/statistics';
import { noopSubscribe } from './noop-subscribe';

function nextTicketNumber(prefix: string, existing: QueueTicket[]): string {
  const nums = existing
    .map((t) => t.ticketNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number.parseInt(n.replace(/^[A-Za-z]+/, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function prefixForOrg(org?: Organization): string {
  if (!org) return 'A';
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
    return this.getTicketById(id);
  }

  async getTicketById(id: string): Promise<QueueTicket | null> {
    return this.tickets.find((t) => t.id === id) ?? null;
  }

  async getMyTickets(): Promise<QueueTicket[]> {
    return this.list();
  }

  async getActiveTicket(): Promise<QueueTicket | null> {
    return this.getPrimaryActive();
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

  async getJoinPreview(serviceId: string): Promise<QueueJoinPreview> {
    const related = this.tickets.filter(
      (t) => t.serviceId === serviceId && t.status === 'waiting',
    );
    return {
      queueId: related[0]?.queueId ?? null,
      queueStatus: 'open',
      currentServing: related[0]?.currentServing ?? '—',
      waitingCount: related.length,
      estimatedWaitMinutes: related.length * 10,
      averageServiceTime: 10,
      canJoin: true,
    };
  }

  async joinQueue(input: JoinQueueInput): Promise<QueueTicket> {
    const organization = input.organization;
    const department = input.department;
    const service = input.service;
    const serviceId = input.serviceId ?? service?.id ?? '';
    const prefix = prefixForOrg(organization);
    const ticketNumber = nextTicketNumber(prefix, this.tickets);
    const peopleAhead = service?.peopleAhead ?? 0;
    const estimatedWaitMinutes = service?.averageWaitMinutes ?? peopleAhead * 10;
    const now = Date.now();

    const ticket: QueueTicket = {
      id: `ticket-${now}`,
      ticketNumber,
      queueId: `queue-${serviceId}`,
      organizationId: organization?.id ?? '',
      locationName: organization?.name ?? '',
      organizationName: organization?.name ?? '',
      departmentId: department?.id ?? '',
      departmentName: department?.name ?? '',
      serviceId,
      serviceName: service?.name ?? '',
      status: peopleAhead <= 1 ? 'almost' : 'waiting',
      position: peopleAhead + 1,
      peopleAhead,
      estimatedWaitMinutes,
      currentServing: `${prefix}001`,
      joinedAt: new Date(now).toISOString(),
      estimatedCompletionAt: new Date(
        now + estimatedWaitMinutes * 60_000,
      ).toISOString(),
      reminderEnabled: true,
      logoIcon: organization?.logoIcon,
      queueEntryId: `qe-${now}`,
      qrCode: `MB-${ticketNumber}-${now}`,
      queueStatus: 'open',
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
    return this.cancelQueueEntry(id);
  }

  async cancelQueueEntry(ticketId: string): Promise<QueueTicket> {
    return this.update(ticketId, {
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
    const now = ticket.joinedAt;
    return {
      id: `qr-${ticket.id}`,
      queueEntryId: ticket.queueEntryId ?? ticket.id,
      userId: '',
      queueId: ticket.queueId,
      organizationId: ticket.organizationId,
      departmentId: ticket.departmentId,
      serviceId: ticket.serviceId,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      qrCode: ticket.qrCode ?? `MB-${ticket.ticketNumber}`,
      createdAt: now,
      updatedAt: now,
      generatedAt: now,
    };
  }

  subscribe(userId: string, callback: (payload: QueueTicket[]) => void) {
    return noopSubscribe(callback);
  }

  getSeedTickets(): QueueTicket[] {
    return this.tickets.map((t) => ({ ...t }));
  }

  replaceAll(tickets: QueueTicket[]): void {
    this.tickets = tickets.map((t) => ({ ...t }));
  }
}
