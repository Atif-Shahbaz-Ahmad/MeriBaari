import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import type { RealtimePostgresPayload } from '@/domain/future';
import type { QueueTicket } from '@/domain/models';
import {
  emitQueueRealtimeEvent,
  emitQueueStatusEvents,
  emitTicketStatusEvents,
} from '@/features/queue/realtime-events';
import {
  queueQueryKeys,
  ticketQueryKeys,
} from '@/features/queue/query-keys';
import { useAuthStore } from '@/store/auth-store';

function asRecord(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

/** Invalidate queue caches for a specific queue without wiping the app. */
export function invalidateQueueQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  queueId?: string,
  organizationId?: string,
) {
  if (queueId) {
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.detail(queueId),
    });
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.businessDetail(queueId),
    });
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.entries(queueId),
    });
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.waiting(queueId),
    });
    // Business detail screen uses [...detail, 'business']
    void queryClient.invalidateQueries({
      queryKey: [...queueQueryKeys.detail(queueId), 'business'],
    });
  }

  if (organizationId) {
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.organization(organizationId),
    });
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.business(organizationId),
    });
  } else {
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.business(),
    });
  }

  // Join previews / service lookups may depend on live waiting counts.
  void queryClient.invalidateQueries({
    queryKey: queueQueryKeys.lists,
  });
}

/** Invalidate ticket caches for a customer (and optional ticket id). */
export function invalidateTicketQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  ticketId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.mine });
  void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.active });
  if (ticketId) {
    void queryClient.invalidateQueries({
      queryKey: ticketQueryKeys.detail(ticketId),
    });
    void queryClient.invalidateQueries({
      queryKey: ticketQueryKeys.progress(ticketId),
    });
  } else {
    void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
  }
}

function handleQueuePayload(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: RealtimePostgresPayload,
) {
  const row = asRecord(payload.new) ?? asRecord(payload.old);
  const queueId = asString(row?.id);
  const organizationId = asString(row?.organization_id);
  const status = asString(row?.status);
  const previousStatus = asString(asRecord(payload.old)?.status);

  if (queueId) {
    emitQueueStatusEvents({
      queueId,
      organizationId,
      status,
      previousStatus,
      payload,
    });
  }

  invalidateQueueQueries(queryClient, queueId, organizationId);
  // Queue aggregates drive customer ticket progress (current serving / wait).
  invalidateTicketQueries(queryClient);
}

function handleQueueEntryPayload(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: RealtimePostgresPayload,
) {
  const row = asRecord(payload.new) ?? asRecord(payload.old);
  const queueId = asString(row?.queue_id);
  const entryId = asString(row?.id);
  const ticketNumber = asString(row?.ticket_number);
  const status = asString(row?.status);

  emitQueueRealtimeEvent({
    type: 'QUEUE_ENTRY_CHANGED',
    queueId,
    entryId,
    ticketNumber,
    status,
    at: new Date().toISOString(),
    payload,
  });

  invalidateQueueQueries(queryClient, queueId);
  invalidateTicketQueries(queryClient);
}

function handleTicketPayload(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: RealtimePostgresPayload,
) {
  const row = asRecord(payload.new) ?? asRecord(payload.old);
  const ticketId = asString(row?.id);
  const queueId = asString(row?.queue_id);
  const organizationId = asString(row?.organization_id);
  const ticketNumber = asString(row?.ticket_number);
  const status = asString(row?.status);
  const previousStatus = asString(asRecord(payload.old)?.status);

  if (ticketId) {
    emitTicketStatusEvents({
      ticketId,
      queueId,
      organizationId,
      ticketNumber,
      status,
      previousStatus,
      payload,
    });
  }

  invalidateTicketQueries(queryClient, ticketId);
  if (queueId) {
    invalidateQueueQueries(queryClient, queueId, organizationId);
  }
}

/**
 * Subscribe to a single queue + its entries (business ops / shared live view).
 */
export function useQueueRealtime(
  queueId: string | undefined,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const enabled = options?.enabled !== false && Boolean(session) && Boolean(queueId);

  useEffect(() => {
    if (!enabled || !queueId) return;

    const realtime = getContainer().realtimeService;
    const unsubs = [
      realtime.subscribeToQueue(queueId, (payload) =>
        handleQueuePayload(queryClient, payload),
      ),
      realtime.subscribeToQueueEntries(queueId, (payload) =>
        handleQueueEntryPayload(queryClient, payload),
      ),
      realtime.onReconnect(() => {
        invalidateQueueQueries(queryClient, queueId);
        invalidateTicketQueries(queryClient);
      }),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [enabled, queueId, queryClient]);
}

/**
 * Business dashboard: org queues + currently selected queue entries.
 */
export function useBusinessQueueRealtime(
  organizationId: string | undefined,
  selectedQueueId?: string | undefined,
) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const enabled = Boolean(session) && Boolean(organizationId);

  useEffect(() => {
    if (!enabled || !organizationId) return;

    const realtime = getContainer().realtimeService;
    const unsubs = [
      realtime.subscribeToOrganizationQueues(organizationId, (payload) =>
        handleQueuePayload(queryClient, payload),
      ),
      realtime.onReconnect(() => {
        invalidateQueueQueries(queryClient, selectedQueueId, organizationId);
        invalidateTicketQueries(queryClient);
      }),
    ];

    if (selectedQueueId) {
      unsubs.push(
        realtime.subscribeToQueue(selectedQueueId, (payload) =>
          handleQueuePayload(queryClient, payload),
        ),
        realtime.subscribeToQueueEntries(selectedQueueId, (payload) =>
          handleQueueEntryPayload(queryClient, payload),
        ),
      );
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [enabled, organizationId, selectedQueueId, queryClient]);
}

/**
 * Customer ticket detail/progress: ticket row + owning queue.
 * Queue subscription keeps currentServing / peopleAhead fresh even when
 * other customers' entries are not visible under RLS.
 */
export function useTicketRealtime(
  ticketId: string | undefined,
  queueId?: string | undefined,
) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const cachedTicket = ticketId
    ? queryClient.getQueryData<QueueTicket>(ticketQueryKeys.detail(ticketId))
    : undefined;
  const resolvedQueueId = queueId ?? cachedTicket?.queueId;
  const enabled = Boolean(session) && Boolean(ticketId);

  // Keep a stable reconnect invalidation target.
  const ticketIdRef = useRef(ticketId);
  ticketIdRef.current = ticketId;

  useEffect(() => {
    if (!enabled || !ticketId) return;

    const realtime = getContainer().realtimeService;
    const unsubs = [
      realtime.subscribeToTicket(ticketId, (payload) =>
        handleTicketPayload(queryClient, payload),
      ),
      realtime.onReconnect(() => {
        invalidateTicketQueries(queryClient, ticketIdRef.current);
        if (resolvedQueueId) {
          invalidateQueueQueries(queryClient, resolvedQueueId);
        }
      }),
    ];

    if (resolvedQueueId) {
      unsubs.push(
        realtime.subscribeToQueue(resolvedQueueId, (payload) => {
          handleQueuePayload(queryClient, payload);
          invalidateTicketQueries(queryClient, ticketId);
        }),
      );
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [enabled, ticketId, resolvedQueueId, queryClient]);
}

/**
 * Customer My Tickets + Home active ticket.
 * Subscribes to the user's tickets and, when an active ticket exists,
 * the related queue for live progress fields.
 */
export function useMyTicketsRealtime(activeQueueId?: string | undefined) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const enabled = Boolean(userId);

  useEffect(() => {
    if (!enabled || !userId) return;

    const realtime = getContainer().realtimeService;
    const unsubs = [
      realtime.subscribeToMyTickets(userId, (payload) =>
        handleTicketPayload(queryClient, payload),
      ),
      realtime.onReconnect(() => {
        invalidateTicketQueries(queryClient);
        if (activeQueueId) {
          invalidateQueueQueries(queryClient, activeQueueId);
        }
      }),
    ];

    if (activeQueueId) {
      unsubs.push(
        realtime.subscribeToQueue(activeQueueId, (payload) => {
          handleQueuePayload(queryClient, payload);
          invalidateTicketQueries(queryClient);
        }),
      );
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [enabled, userId, activeQueueId, queryClient]);
}

/**
 * Live join preview while confirming a service.
 */
export function useJoinPreviewRealtime(
  queueId: string | undefined,
  serviceId: string | undefined,
) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const enabled = Boolean(session) && Boolean(queueId);

  useEffect(() => {
    if (!enabled || !queueId) return;

    const realtime = getContainer().realtimeService;
    const refreshPreview = () => {
      invalidateQueueQueries(queryClient, queueId);
      if (serviceId) {
        void queryClient.invalidateQueries({
          queryKey: queueQueryKeys.preview(serviceId),
        });
      }
    };

    const unsubs = [
      realtime.subscribeToQueue(queueId, (payload) => {
        handleQueuePayload(queryClient, payload);
        if (serviceId) {
          void queryClient.invalidateQueries({
            queryKey: queueQueryKeys.preview(serviceId),
          });
        }
      }),
      realtime.subscribeToQueueEntries(queueId, (payload) => {
        handleQueueEntryPayload(queryClient, payload);
        if (serviceId) {
          void queryClient.invalidateQueries({
            queryKey: queueQueryKeys.preview(serviceId),
          });
        }
      }),
      realtime.onReconnect(refreshPreview),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [enabled, queueId, serviceId, queryClient]);
}
