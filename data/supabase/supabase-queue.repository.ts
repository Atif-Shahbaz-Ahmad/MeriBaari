import type { Queue } from '@/domain/models';
import type {
  QueueCreateInput,
  QueueRepository,
  QueueUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import { QueueError, toQueueError } from '@/domain/errors/queue-error';
import {
  mapDbQueueStatus,
  mapDomainQueueStatusToDb,
  mapQueueRow,
  mapQueueTicketPayload,
} from '@/data/supabase/mappers';
import { noopSubscribe } from '@/data/mock/noop-subscribe';
import { requireSupabase } from '@/lib/supabase';
import type { QueueRow } from '@/supabase/types';
import type { BusinessQueue, BusinessQueueDetailsStats } from '@/types/business';
import type { QueueProgressDetails, QueueTimelineEntry } from '@/types/queue';

type QueueRowWithNames = QueueRow & {
  departments?: { name: string } | null;
  services?: { name: string } | null;
};

/**
 * Build a short progress timeline without duplicate ticket-number keys.
 * When Call Next reaches this customer, currentServing === ticketNumber.
 */
function buildCustomerProgressTimeline(
  currentServing: string,
  yourTicketNumber: string,
): QueueTimelineEntry[] {
  const serving = (currentServing || '').trim();
  const yours = (yourTicketNumber || '').trim();

  if (!serving && !yours) return [];

  if (serving && yours && serving === yours) {
    return [
      {
        ticketNumber: yours,
        label: 'You · Now',
        isServing: true,
        isYou: true,
      },
    ];
  }

  const entries: QueueTimelineEntry[] = [];
  if (serving) {
    entries.push({
      ticketNumber: serving,
      label: 'Now',
      isServing: true,
    });
  }
  if (yours) {
    entries.push({
      ticketNumber: yours,
      label: 'You',
      isYou: true,
    });
  }
  return entries;
}

function toBusinessQueue(row: QueueRowWithNames): BusinessQueue {
  const queue = mapQueueRow(row);
  const current = queue.currentNumber || '—';
  const nextDisplay = `${queue.prefix}${String(queue.nextNumber).padStart(3, '0')}`;

  return {
    id: queue.id,
    name: row.services?.name ?? queue.name ?? 'Queue',
    departmentId: queue.departmentId,
    departmentName: row.departments?.name ?? '',
    serviceId: queue.serviceId,
    serviceName: row.services?.name ?? '',
    status: queue.status === 'open' ? 'active' : queue.status,
    currentServing: current,
    nextNumber: nextDisplay,
    waitingCount: queue.totalWaiting,
    estimatedWaitMinutes: queue.totalWaiting * queue.averageServiceTime,
    averageWaitMinutes: queue.averageServiceTime,
    prefix: queue.prefix,
  };
}

export class SupabaseQueueRepository implements QueueRepository {
  async getById(id: string): Promise<Queue | null> {
    return this.getQueueById(id);
  }

  async getQueueById(id: string): Promise<Queue | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapQueueRow(data as QueueRow) : null;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getQueueByService(serviceId: string): Promise<Queue | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('service_id', serviceId)
        .in('status', ['active', 'open', 'paused'])
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapQueueRow(data as QueueRow) : null;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getOrganizationQueues(organizationId: string): Promise<Queue[]> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapQueueRow(row as QueueRow));
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async listByDepartment(departmentId: string): Promise<Queue[]> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('department_id', departmentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => mapQueueRow(row as QueueRow));
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async listBusinessQueues(organizationId?: string): Promise<BusinessQueue[]> {
    const supabase = requireSupabase();
    try {
      let builder = supabase
        .from('queues')
        .select('*, departments(name), services(name)')
        .order('updated_at', { ascending: false });

      if (organizationId) {
        builder = builder.eq('organization_id', organizationId);
      }

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []).map((row) => toBusinessQueue(row as QueueRowWithNames));
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getBusinessQueueById(id: string): Promise<BusinessQueue | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*, departments(name), services(name)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? toBusinessQueue(data as QueueRowWithNames) : null;
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getBusinessQueueDetails(
    id: string,
  ): Promise<BusinessQueueDetailsStats | null> {
    const supabase = requireSupabase();
    try {
      const queue = await this.getQueueById(id);
      if (!queue) return null;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: entries, error } = await supabase
        .from('queue_entries')
        .select('status, served_at, completed_at, cancelled_at, joined_at')
        .eq('queue_id', id);
      if (error) throw error;

      const rows = entries ?? [];
      const waiting = rows.filter((e) => e.status === 'waiting').length;
      const completedToday = rows.filter((e) => {
        const served = e.served_at ?? e.completed_at;
        return (
          (e.status === 'served' || e.status === 'completed') &&
          served &&
          new Date(served) >= startOfDay
        );
      }).length;
      const cancelledToday = rows.filter(
        (e) =>
          (e.status === 'cancelled' || e.status === 'skipped') &&
          e.cancelled_at &&
          new Date(e.cancelled_at) >= startOfDay,
      ).length;

      return {
        queueId: id,
        totalWaiting: waiting,
        completedToday,
        cancelledToday,
        averageServiceMinutes: queue.averageServiceTime,
        queueSpeed:
          queue.averageServiceTime > 0
            ? Math.round(60 / queue.averageServiceTime)
            : 0,
      };
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getProgressByTicketId(
    ticketId: string,
  ): Promise<QueueProgressDetails | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('build_queue_ticket_payload', {
        p_ticket_id: ticketId,
      });
      if (error) throw error;
      if (!data) return null;

      const ticket = mapQueueTicketPayload(data);
      const avg = ticket.estimatedWaitMinutes
        ? Math.max(
            1,
            Math.round(
              ticket.estimatedWaitMinutes / Math.max(ticket.peopleAhead, 1),
            ),
          )
        : 10;

      return {
        queueId: ticket.queueId,
        ticketId: ticket.id,
        capacity: Math.max(ticket.position + ticket.peopleAhead, 1),
        currentPosition: ticket.position,
        peopleRemaining: ticket.peopleAhead,
        averageServiceMinutes: avg,
        estimatedFinishAt:
          ticket.estimatedCompletionAt ??
          new Date(
            Date.now() + ticket.estimatedWaitMinutes * 60_000,
          ).toISOString(),
        currentServing: ticket.currentServing,
        queueSpeed: Math.round(60 / avg),
        lastUpdatedAt: new Date().toISOString(),
        timeline: buildCustomerProgressTimeline(
          ticket.currentServing,
          ticket.ticketNumber,
        ),
      };
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async getProgressSequence(ticketId: string): Promise<string[]> {
    const progress = await this.getProgressByTicketId(ticketId);
    if (!progress) return [];
    return progress.timeline.map((t) => t.ticketNumber).filter(Boolean);
  }

  async createQueue(input: QueueCreateInput): Promise<Queue> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('queues')
        .insert({
          organization_id: input.organizationId,
          department_id: input.departmentId,
          service_id: input.serviceId,
          status: mapDomainQueueStatusToDb(input.status ?? 'open'),
          average_service_time: input.averageServiceTime ?? 10,
          average_waiting_time: input.averageServiceTime ?? 10,
          prefix: input.prefix ?? 'A',
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapQueueRow(data as QueueRow);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  async update(id: string, input: QueueUpdateInput): Promise<Queue> {
    return this.updateQueue(id, input);
  }

  async updateQueue(id: string, input: QueueUpdateInput): Promise<Queue> {
    const supabase = requireSupabase();
    try {
      const patch: {
        status?: 'active' | 'paused' | 'closed';
        current_number?: string;
        current_serving_number?: string;
        average_service_time?: number;
        average_waiting_time?: number;
        total_waiting?: number;
      } = {};
      if (input.status) patch.status = mapDomainQueueStatusToDb(input.status);
      if (input.currentNumber !== undefined) {
        patch.current_number = input.currentNumber;
        patch.current_serving_number = input.currentNumber;
      }
      if (input.currentServingNumber !== undefined) {
        patch.current_number = input.currentServingNumber;
        patch.current_serving_number = input.currentServingNumber;
      }
      if (input.averageServiceTime !== undefined) {
        patch.average_service_time = input.averageServiceTime;
        patch.average_waiting_time = input.averageServiceTime;
      }
      if (input.averageWaitingTime !== undefined) {
        patch.average_service_time = input.averageWaitingTime;
        patch.average_waiting_time = input.averageWaitingTime;
      }
      if (input.totalWaiting !== undefined) {
        patch.total_waiting = input.totalWaiting;
      }

      const { data, error } = await supabase
        .from('queues')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapQueueRow(data as QueueRow);
    } catch (e) {
      throw toQueueError(e);
    }
  }

  private async setStatus(
    id: string,
    status: 'open' | 'paused' | 'closed',
  ): Promise<Queue> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('set_queue_status', {
        p_queue_id: id,
        p_status: status,
      });
      if (error) throw error;
      const payload = data as { id?: string; status?: string } | null;
      if (!payload?.id) {
        throw new QueueError('unknown', 'Failed to update queue status.');
      }
      const queue = await this.getQueueById(payload.id);
      if (!queue) throw new QueueError('not_found', 'Queue not found.');
      return {
        ...queue,
        status: mapDbQueueStatus(payload.status ?? status),
      };
    } catch (e) {
      throw toQueueError(e);
    }
  }

  pauseQueue(id: string): Promise<Queue> {
    return this.setStatus(id, 'paused');
  }

  resumeQueue(id: string): Promise<Queue> {
    return this.setStatus(id, 'open');
  }

  closeQueue(id: string): Promise<Queue> {
    return this.setStatus(id, 'closed');
  }

  subscribe(id: string, callback: SubscribeCallback<Queue>): Unsubscribe {
    return noopSubscribe(callback);
  }

  subscribeBusinessQueues(
    callback: SubscribeCallback<BusinessQueue[]>,
  ): Unsubscribe {
    return noopSubscribe(callback);
  }
}
