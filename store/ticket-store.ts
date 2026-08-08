import { create } from 'zustand';

import { getContainer } from '@/data';
import type { Department, Organization, QueueService, QueueStatus, QueueTicket } from '@/types';

interface TicketState {
  tickets: QueueTicket[];
  lastJoinedTicketId: string | null;
  addTicket: (ticket: QueueTicket) => void;
  joinQueue: (input: {
    organization: Organization;
    department: Department;
    service: QueueService;
  }) => QueueTicket;
  getTicket: (id: string) => QueueTicket | undefined;
  setReminder: (id: string, enabled: boolean) => void;
  cancelTicket: (id: string) => void;
  updateStatus: (id: string, status: QueueStatus) => void;
  clearLastJoined: () => void;
}

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

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: getContainer().mockTicketRepository.getSeedTickets(),
  lastJoinedTicketId: null,

  addTicket: (ticket) =>
    set((state) => ({
      tickets: [ticket, ...state.tickets],
      lastJoinedTicketId: ticket.id,
    })),

  joinQueue: ({ organization, department, service }) => {
    const prefix = prefixForOrg(organization);
    const ticketNumber = nextTicketNumber(prefix, get().tickets);
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
    };

    set((state) => ({
      tickets: [ticket, ...state.tickets],
      lastJoinedTicketId: ticket.id,
    }));

    return ticket;
  },

  getTicket: (id) => get().tickets.find((t) => t.id === id),

  setReminder: (id, enabled) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, reminderEnabled: enabled } : t,
      ),
    })),

  cancelTicket: (id) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'cancelled' as const,
              cancelledAt: new Date().toISOString(),
              peopleAhead: 0,
              position: 0,
              estimatedWaitMinutes: 0,
            }
          : t,
      ),
    })),

  updateStatus: (id, status) =>
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id !== id) return t;
        const patch: Partial<QueueTicket> = { status };
        if (status === 'completed') {
          patch.completedAt = new Date().toISOString();
          patch.peopleAhead = 0;
          patch.position = 0;
          patch.estimatedWaitMinutes = 0;
          patch.actualWaitMinutes = Math.max(
            1,
            Math.round((Date.now() - new Date(t.joinedAt).getTime()) / 60_000),
          );
        }
        if (status === 'cancelled' || status === 'missed') {
          patch.cancelledAt = new Date().toISOString();
          patch.peopleAhead = 0;
          patch.position = 0;
          patch.estimatedWaitMinutes = 0;
        }
        return { ...t, ...patch };
      }),
    })),

  clearLastJoined: () => set({ lastJoinedTicketId: null }),
}));
