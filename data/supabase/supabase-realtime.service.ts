import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import type {
  RealtimeConnectionStatus,
  RealtimePostgresPayload,
  RealtimeService,
  Unsubscribe,
} from '@/domain/future';
import { getSupabase } from '@/lib/supabase';

type ChannelKey = string;
type PayloadHandler = (payload: RealtimePostgresPayload) => void;

interface ManagedChannel {
  channel: RealtimeChannel;
  handlers: Set<PayloadHandler>;
}

/**
 * Central Supabase Realtime subscription manager.
 * Screens/hooks must not create raw channels — use this service.
 *
 * Duplicate subscribe calls for the same key share one channel and
 * fan out to multiple handlers. Cleanup removes the channel when the
 * last handler unsubscribes.
 */
export class SupabaseRealtimeService implements RealtimeService {
  private managed = new Map<ChannelKey, ManagedChannel>();
  private reconnectListeners = new Set<() => void>();
  private status: RealtimeConnectionStatus = 'idle';
  private hadDisconnect = false;
  private globalHooksAttached = false;

  subscribeToQueue(
    queueId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe {
    if (!queueId) return () => undefined;
    return this.subscribeTable({
      key: `queue:${queueId}`,
      table: 'queues',
      filter: `id=eq.${queueId}`,
      onUpdate,
    });
  }

  subscribeToQueueEntries(
    queueId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe {
    if (!queueId) return () => undefined;
    return this.subscribeTable({
      key: `queue-entries:${queueId}`,
      table: 'queue_entries',
      filter: `queue_id=eq.${queueId}`,
      onUpdate,
    });
  }

  subscribeToTicket(
    ticketId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe {
    if (!ticketId) return () => undefined;
    return this.subscribeTable({
      key: `ticket:${ticketId}`,
      table: 'tickets',
      filter: `id=eq.${ticketId}`,
      onUpdate,
    });
  }

  subscribeToMyTickets(
    userId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe {
    if (!userId) return () => undefined;
    return this.subscribeTable({
      key: `my-tickets:${userId}`,
      table: 'tickets',
      filter: `user_id=eq.${userId}`,
      onUpdate,
    });
  }

  subscribeToOrganizationQueues(
    organizationId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe {
    if (!organizationId) return () => undefined;
    return this.subscribeTable({
      key: `org-queues:${organizationId}`,
      table: 'queues',
      filter: `organization_id=eq.${organizationId}`,
      onUpdate,
    });
  }

  subscribeToNotifications(
    userId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe {
    if (!userId) return () => undefined;
    return this.subscribeTable({
      key: `notifications:${userId}`,
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
      onUpdate,
    });
  }

  onReconnect(callback: () => void): Unsubscribe {
    this.reconnectListeners.add(callback);
    return () => {
      this.reconnectListeners.delete(callback);
    };
  }

  getConnectionStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  unsubscribeAll(): void {
    const supabase = getSupabase();
    for (const entry of this.managed.values()) {
      try {
        if (supabase) {
          void supabase.removeChannel(entry.channel);
        } else {
          void entry.channel.unsubscribe();
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[realtime] unsubscribeAll channel error', error);
        }
      }
    }
    this.managed.clear();
    this.status = this.managed.size === 0 ? 'idle' : this.status;
    this.hadDisconnect = false;
  }

  private attachGlobalHooksOnce(): void {
    if (this.globalHooksAttached) return;
    const supabase = getSupabase();
    if (!supabase) return;

    this.globalHooksAttached = true;

    // RealtimeClient connection hooks are not consistently typed across
    // supabase-js versions — attach defensively and rely on channel status too.
    const realtime = supabase.realtime as {
      onOpen?: (cb: () => void) => void;
      onClose?: (cb: () => void) => void;
      onError?: (cb: (error: unknown) => void) => void;
    };

    realtime.onOpen?.(() => {
      const recovered = this.hadDisconnect;
      this.status = 'connected';
      if (recovered) {
        this.hadDisconnect = false;
        this.notifyReconnect();
      }
    });

    realtime.onClose?.(() => {
      this.hadDisconnect = true;
      this.status = 'disconnected';
    });

    realtime.onError?.((error: unknown) => {
      this.hadDisconnect = true;
      this.status = 'error';
      if (__DEV__) {
        console.warn('[realtime] connection error', error);
      }
    });
  }

  private notifyReconnect(): void {
    if (__DEV__) {
      console.log('[realtime] connection restored — refreshing queries');
    }
    for (const listener of this.reconnectListeners) {
      try {
        listener();
      } catch (error) {
        if (__DEV__) {
          console.warn('[realtime] reconnect listener error', error);
        }
      }
    }
  }

  private subscribeTable(options: {
    key: ChannelKey;
    table: 'queues' | 'queue_entries' | 'tickets' | 'notifications';
    filter: string;
    onUpdate: PayloadHandler;
  }): Unsubscribe {
    const supabase = getSupabase();
    if (!supabase) {
      if (__DEV__) {
        console.warn('[realtime] Supabase not configured — skipping subscribe');
      }
      return () => undefined;
    }

    this.attachGlobalHooksOnce();

    let managed = this.managed.get(options.key);
    if (managed) {
      managed.handlers.add(options.onUpdate);
      return () => this.removeHandler(options.key, options.onUpdate);
    }

    this.status = this.status === 'connected' ? 'connected' : 'connecting';

    const handlers = new Set<PayloadHandler>([options.onUpdate]);

    const channel = supabase
      .channel(options.key)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.table,
          filter: options.filter,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const mapped = mapPayload(payload);
          const current = this.managed.get(options.key);
          if (!current) return;
          for (const handler of current.handlers) {
            try {
              handler(mapped);
            } catch (error) {
              if (__DEV__) {
                console.warn('[realtime] handler error', options.table, error);
              }
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          const recovered = this.hadDisconnect;
          this.status = 'connected';
          if (recovered) {
            this.hadDisconnect = false;
            this.notifyReconnect();
          }
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.hadDisconnect = true;
          this.status = 'error';
          if (__DEV__) {
            console.warn(
              '[realtime] channel status',
              options.key,
              status,
              err?.message ?? err,
            );
          }
          return;
        }

        if (status === 'CLOSED') {
          if (this.managed.size === 0) {
            this.status = 'disconnected';
          }
        }
      });

    managed = { channel, handlers };
    this.managed.set(options.key, managed);

    return () => this.removeHandler(options.key, options.onUpdate);
  }

  private removeHandler(key: ChannelKey, handler: PayloadHandler): void {
    const managed = this.managed.get(key);
    if (!managed) return;

    managed.handlers.delete(handler);
    if (managed.handlers.size > 0) return;

    this.managed.delete(key);
    const supabase = getSupabase();
    try {
      if (supabase) {
        void supabase.removeChannel(managed.channel);
      } else {
        void managed.channel.unsubscribe();
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[realtime] removeChannel error', error);
      }
    }

    if (this.managed.size === 0 && this.status !== 'error') {
      this.status = 'idle';
    }
  }
}

function mapPayload(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): RealtimePostgresPayload {
  return {
    eventType: payload.eventType,
    schema: payload.schema,
    table: payload.table,
    new: (payload.new as Record<string, unknown> | null) ?? null,
    old: (payload.old as Record<string, unknown> | null) ?? null,
    commitTimestamp: payload.commit_timestamp,
  };
}
