import type { QueueJoinPreview, QueueTicket, Ticket } from '@/domain/models';
import type {
  JoinQueueInput,
  TicketRepository,
  TicketUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import { QueueError, toQueueError } from '@/domain/errors/queue-error';
import {
  mapJoinPreviewPayload,
  mapQueueTicketPayload,
  mapTicketRow,
} from '@/data/supabase/mappers';
import { noopSubscribe } from '@/data/mock/noop-subscribe';
import { requireSupabase } from '@/lib/supabase';
import type { TicketRow } from '@/supabase/types';
import type { TicketStatistics } from '@/types/queue';
import {
  getActiveTickets,
  getCancelledTickets,
  getCompletedTickets,
  getPrimaryActiveTicket,
  isActiveStatus,
} from '@/mock/tickets';
import { getHistoryTickets } from '@/mock/history';
import { computeTicketStatistics } from '@/mock/statistics';

async function loadTicketPayload(ticketId: string): Promise<QueueTicket | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc('build_queue_ticket_payload', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
  if (!data) return null;
  return mapQueueTicketPayload(data);
}

export class SupabaseTicketRepository implements TicketRepository {
  async getById(id: string): Promise<QueueTicket | null> {
    return this.getTicketById(id);
  }

  async getTicketById(id: string): Promise<QueueTicket | null> {
    try {
      return await loadTicketPayload(id);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getMyTickets(): Promise<QueueTicket[]> {
    return this.list();
  }

  async getActiveTicket(): Promise<QueueTicket | null> {
    return this.getPrimaryActive();
  }

  async list(): Promise<QueueTicket[]> {
    const supabase = requireSupabase();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new QueueError('unauthorized', 'Please sign in.');

      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const tickets: QueueTicket[] = [];
      for (const row of data ?? []) {
        const ticket = await loadTicketPayload(row.id);
        if (ticket) tickets.push(ticket);
      }
      return tickets;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async listActive(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    const source = tickets ?? (await this.list());
    return getActiveTickets(source);
  }

  async listCompleted(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    const source = tickets ?? (await this.list());
    return getCompletedTickets(source);
  }

  async listCancelled(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    const source = tickets ?? (await this.list());
    return getCancelledTickets(source);
  }

  async listHistory(tickets?: QueueTicket[]): Promise<QueueTicket[]> {
    const source = tickets ?? (await this.list());
    return getHistoryTickets(source);
  }

  async getPrimaryActive(tickets?: QueueTicket[]): Promise<QueueTicket | null> {
    const source = tickets ?? (await this.list());
    return getPrimaryActiveTicket(source) ?? null;
  }

  async getJoinPreview(serviceId: string): Promise<QueueJoinPreview> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('get_queue_join_preview', {
        p_service_id: serviceId,
      });
      if (error) throw error;
      return mapJoinPreviewPayload(data);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async joinQueue(input: JoinQueueInput): Promise<QueueTicket> {
    const serviceId = input.serviceId ?? input.service?.id;
    if (!serviceId) {
      throw new QueueError('invalid_data', 'A service is required to join a queue.');
    }

    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('join_queue', {
        p_service_id: serviceId,
      });
      if (error) throw error;
      if (!data) {
        throw new QueueError('unknown', 'Ticket generation failed.');
      }
      return mapQueueTicketPayload(data);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async update(id: string, input: TicketUpdateInput): Promise<QueueTicket> {
    // Reminder / local UI fields are client-only for now.
    const ticket = await this.getTicketById(id);
    if (!ticket) throw new QueueError('not_found', 'Ticket not found.');
    return {
      ...ticket,
      ...input,
      status: input.status ?? ticket.status,
    };
  }

  async cancel(id: string): Promise<QueueTicket> {
    return this.cancelQueueEntry(id);
  }

  async cancelQueueEntry(ticketId: string): Promise<QueueTicket> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('cancel_my_ticket', {
        p_ticket_id: ticketId,
      });
      if (error) throw error;
      if (!data) throw new QueueError('not_found', 'Ticket not found.');
      return mapQueueTicketPayload(data);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getStatistics(tickets?: QueueTicket[]): Promise<TicketStatistics> {
    const source = tickets ?? (await this.list());
    return computeTicketStatistics(source);
  }

  async getQrTicket(ticketId: string): Promise<Ticket | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapTicketRow(data as TicketRow) : null;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  subscribe(
    userId: string,
    callback: SubscribeCallback<QueueTicket[]>,
  ): Unsubscribe {
    return noopSubscribe(callback);
  }
}

export { isActiveStatus };
