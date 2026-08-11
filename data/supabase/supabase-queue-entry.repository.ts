import type { QueueEntry, QueueTicket } from '@/domain/models';
import type {
  CallNextResult,
  JoinQueueByServiceInput,
  QueueEntryActionResult,
  QueueEntryCreateInput,
  QueueEntryRepository,
  QueueEntryUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import { QueueError, toQueueError } from '@/domain/errors/queue-error';
import {
  mapQueueEntryRow,
  mapQueueTicketPayload,
} from '@/data/supabase/mappers';
import { noopSubscribe } from '@/data/mock/noop-subscribe';
import { requireSupabase } from '@/lib/supabase';
import type { QueueEntryRow } from '@/supabase/types';
import type { BusinessWaitingCustomer, WalkInDraft } from '@/types/business';

type EntryWithProfile = QueueEntryRow & {
  profiles?: { full_name: string | null; phone: string | null } | null;
};

function toWaitingCustomer(row: EntryWithProfile): BusinessWaitingCustomer {
  const status =
    row.status === 'waiting' ||
    row.status === 'called' ||
    row.status === 'serving' ||
    row.status === 'skipped'
      ? row.status
      : 'waiting';

  return {
    id: row.id,
    queueId: row.queue_id,
    queueNumber: row.ticket_number,
    customerName: row.profiles?.full_name?.trim() || 'Customer',
    phone: row.profiles?.phone ?? undefined,
    joinedAt: row.joined_at,
    estimatedServiceMinutes: row.estimated_wait_minutes || 5,
    priority: 'normal',
    status,
  };
}

function mapActionResult(raw: unknown): QueueEntryActionResult {
  const p = (raw ?? {}) as {
    entryId?: string;
    ticketId?: string | null;
    ticketNumber?: string;
    status?: string;
    servedAt?: string | null;
    next?: CallNextResult | null;
  };
  return {
    entryId: p.entryId ?? '',
    ticketId: p.ticketId ?? null,
    ticketNumber: p.ticketNumber ?? '',
    status: p.status ?? '',
    servedAt: p.servedAt,
    next: p.next ?? null,
  };
}

export class SupabaseQueueEntryRepository implements QueueEntryRepository {
  async getById(id: string): Promise<QueueEntry | null> {
    return this.getQueueEntryById(id);
  }

  async getQueueEntryById(id: string): Promise<QueueEntry | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapQueueEntryRow(data as QueueEntryRow) : null;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async listByQueue(queueId: string): Promise<QueueEntry[]> {
    return this.getQueueEntries(queueId);
  }

  async getQueueEntries(queueId: string): Promise<QueueEntry[]> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('queue_id', queueId)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => mapQueueEntryRow(row as QueueEntryRow));
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getMyActiveQueueEntries(): Promise<QueueEntry[]> {
    const supabase = requireSupabase();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new QueueError('unauthorized', 'Please sign in.');

      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('customer_id', user.id)
        .in('status', ['waiting', 'called', 'serving'])
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapQueueEntryRow(row as QueueEntryRow));
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async listWaitingCustomers(
    queueId?: string,
  ): Promise<BusinessWaitingCustomer[]> {
    const supabase = requireSupabase();
    try {
      let builder = supabase
        .from('queue_entries')
        .select('*, profiles(full_name, phone)')
        .in('status', ['waiting', 'called', 'serving'])
        .order('joined_at', { ascending: true });

      if (queueId) {
        builder = builder.eq('queue_id', queueId);
      }

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []).map((row) =>
        toWaitingCustomer(row as EntryWithProfile),
      );
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async listAllWaitingCustomers(): Promise<BusinessWaitingCustomer[]> {
    return this.listWaitingCustomers();
  }

  async create(input: QueueEntryCreateInput): Promise<QueueEntry> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          queue_id: input.queueId,
          customer_id: input.userId ?? input.customerId ?? null,
          service_id: input.serviceId,
          ticket_number: input.ticketNumber,
          position: input.position,
          status: 'waiting',
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapQueueEntryRow(data as QueueEntryRow);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async createWalkIn(_draft: WalkInDraft): Promise<BusinessWaitingCustomer> {
    throw new QueueError(
      'not_configured',
      'Walk-in tickets will be available in a later update.',
    );
  }

  async update(id: string, input: QueueEntryUpdateInput): Promise<QueueEntry> {
    const supabase = requireSupabase();
    try {
      const patch: {
        status?: QueueEntry['status'];
        position?: number;
        called_at?: string | null;
        served_at?: string | null;
        completed_at?: string | null;
        cancelled_at?: string | null;
        estimated_wait_minutes?: number;
      } = {};
      if (input.status !== undefined) patch.status = input.status;
      if (input.position !== undefined) patch.position = input.position;
      if (input.calledAt !== undefined) patch.called_at = input.calledAt;
      if (input.servedAt !== undefined) {
        patch.served_at = input.servedAt;
        patch.completed_at = input.servedAt;
      }
      if (input.completedAt !== undefined) {
        patch.completed_at = input.completedAt;
        patch.served_at = input.completedAt;
      }
      if (input.cancelledAt !== undefined) patch.cancelled_at = input.cancelledAt;
      if (input.estimatedWaitMinutes !== undefined) {
        patch.estimated_wait_minutes = input.estimatedWaitMinutes;
      }

      const { data, error } = await supabase
        .from('queue_entries')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapQueueEntryRow(data as QueueEntryRow);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async delete(id: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.from('queue_entries').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async joinQueue(input: JoinQueueByServiceInput): Promise<QueueTicket> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('join_queue', {
        p_service_id: input.serviceId,
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

  async cancelQueueEntry(entryId: string): Promise<QueueEntry> {
    const supabase = requireSupabase();
    try {
      const entry = await this.getQueueEntryById(entryId);
      if (!entry) throw new QueueError('not_found', 'Queue entry not found.');

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('queue_entry_id', entryId)
        .maybeSingle();
      if (ticketError) throw ticketError;
      if (!ticket?.id) {
        throw new QueueError('not_found', 'Ticket not found for this entry.');
      }

      const { error } = await supabase.rpc('cancel_my_ticket', {
        p_ticket_id: ticket.id,
      });
      if (error) throw error;

      const updated = await this.getQueueEntryById(entryId);
      if (!updated) throw new QueueError('not_found', 'Queue entry not found.');
      return updated;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async callNextCustomer(queueId: string): Promise<CallNextResult> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('call_next_customer', {
        p_queue_id: queueId,
      });
      if (error) throw error;
      const p = (data ?? {}) as unknown as CallNextResult;
      return {
        entryId: p.entryId,
        ticketId: p.ticketId ?? null,
        ticketNumber: p.ticketNumber,
        status: 'called',
        calledAt: p.calledAt ?? null,
        customerId: p.customerId ?? null,
      };
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async startServing(entryId: string): Promise<QueueEntryActionResult> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('start_serving_customer', {
        p_entry_id: entryId,
      });
      if (error) throw error;
      return mapActionResult(data);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async serveCustomer(entryId: string): Promise<QueueEntryActionResult> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('serve_customer', {
        p_entry_id: entryId,
      });
      if (error) throw error;
      return mapActionResult(data);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async skipCustomer(entryId: string): Promise<QueueEntryActionResult> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('skip_customer', {
        p_entry_id: entryId,
      });
      if (error) throw error;
      return mapActionResult(data);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  subscribe(
    queueId: string,
    callback: SubscribeCallback<QueueEntry[]>,
  ): Unsubscribe {
    return noopSubscribe(callback);
  }
}
