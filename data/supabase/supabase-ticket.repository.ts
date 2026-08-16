import type { QueueJoinPreview, QueueTicket, Ticket } from '@/domain/models';
import type {
  JoinQueueInput,
  TicketHistoryListParams,
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
import type { QueueStatus } from '@/types';

/** DB ticket statuses that map to customer/owner history views. */
const DB_HISTORY_STATUSES = ['served', 'cancelled', 'skipped'] as const;

const DEFAULT_HISTORY_LIMIT = 40;

function mapDbTicketStatus(status: string): QueueStatus {
  switch (status) {
    case 'served':
    case 'cancelled':
    case 'skipped':
    case 'called':
    case 'serving':
    case 'waiting':
      return status;
    default:
      return 'waiting';
  }
}

function unwrapEntry(value: unknown): {
  joined_at?: string;
  served_at?: string | null;
  completed_at?: string | null;
  estimated_wait_minutes?: number;
} | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] as { joined_at?: string }) ?? null;
  }
  return value as { joined_at?: string };
}

function localDayBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function loadTicketPayload(ticketId: string): Promise<QueueTicket | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc('build_queue_ticket_payload', {
    p_ticket_id: ticketId,
  });
  if (error) throw error;
  if (!data) return null;
  return mapQueueTicketPayload(data);
}

async function loadTicketPayloads(ids: string[]): Promise<QueueTicket[]> {
  const tickets: QueueTicket[] = [];
  for (const id of ids) {
    const ticket = await loadTicketPayload(id);
    if (ticket) tickets.push(ticket);
  }
  return getHistoryTickets(tickets);
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

  async listMyHistory(params?: TicketHistoryListParams): Promise<QueueTicket[]> {
    const supabase = requireSupabase();
    const limit = params?.limit ?? DEFAULT_HISTORY_LIMIT;
    const offset = Math.max(0, params?.offset ?? 0);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new QueueError('unauthorized', 'Please sign in.');

      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('user_id', user.id)
        .in('status', [...DB_HISTORY_STATUSES])
        .order('updated_at', { ascending: false })
        .range(offset, offset + Math.max(0, limit) - 1);
      if (error) throw error;

      return loadTicketPayloads((data ?? []).map((row) => row.id));
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async listOrganizationHistory(
    organizationId: string,
    params?: TicketHistoryListParams,
  ): Promise<QueueTicket[]> {
    const supabase = requireSupabase();
    const limit = params?.limit ?? DEFAULT_HISTORY_LIMIT;
    const offset = Math.max(0, params?.offset ?? 0);

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('organization_id', organizationId)
        .in('status', [...DB_HISTORY_STATUSES])
        .order('updated_at', { ascending: false })
        .range(offset, offset + Math.max(0, limit) - 1);
      if (error) throw error;

      return loadTicketPayloads((data ?? []).map((row) => row.id));
    } catch (e) {
      throw toQueueError(e);
    }
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
    if (tickets) return computeTicketStatistics(tickets);

    const supabase = requireSupabase();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new QueueError('unauthorized', 'Please sign in.');

      const { data, error } = await supabase
        .from('tickets')
        .select(
          'status, organization_id, queue_entries(joined_at, served_at, completed_at, estimated_wait_minutes)',
        )
        .eq('user_id', user.id);
      if (error) throw error;

      const rows = data ?? [];
      const orgIds = [
        ...new Set(
          rows
            .map((row) => row.organization_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const names = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        if (!orgError) {
          for (const org of orgs ?? []) {
            names.set(org.id, org.name);
          }
        }
      }

      return computeTicketStatistics(
        rows.map((row) => {
          const entry = unwrapEntry(row.queue_entries);
          const joined = entry?.joined_at;
          const done = entry?.served_at ?? entry?.completed_at ?? undefined;
          const actualWaitMinutes =
            joined && done
              ? Math.max(
                  1,
                  Math.round(
                    (new Date(done).getTime() - new Date(joined).getTime()) /
                      60_000,
                  ),
                )
              : undefined;
          return {
            status: mapDbTicketStatus(row.status),
            organizationName: names.get(row.organization_id ?? '') ?? '',
            estimatedWaitMinutes: entry?.estimated_wait_minutes ?? 0,
            actualWaitMinutes,
          };
        }),
      );
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async countOrganizationServedToday(organizationId: string): Promise<number> {
    const supabase = requireSupabase();
    const { start, end } = localDayBounds();
    try {
      const { count, error } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'served')
        .gte('updated_at', start)
        .lt('updated_at', end);
      if (error) throw error;
      return count ?? 0;
    } catch (e) {
      throw toQueueError(e);
    }
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
