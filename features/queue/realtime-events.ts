/**
 * Clean event layer for future notifications (Prompt 4.7).
 * Emits semantic queue/ticket events from Realtime payloads.
 * Does NOT send push/email/WhatsApp notifications yet.
 */

export type QueueRealtimeEventType =
  | 'QUEUE_TURN_APPROACHING'
  | 'TICKET_CALLED'
  | 'TICKET_SERVING'
  | 'TICKET_SERVED'
  | 'TICKET_SKIPPED'
  | 'TICKET_CANCELLED'
  | 'QUEUE_PAUSED'
  | 'QUEUE_RESUMED'
  | 'QUEUE_CLOSED'
  | 'QUEUE_UPDATED'
  | 'QUEUE_ENTRY_CHANGED'
  | 'TICKET_CHANGED';

export interface QueueRealtimeEvent {
  type: QueueRealtimeEventType;
  queueId?: string;
  ticketId?: string;
  entryId?: string;
  organizationId?: string;
  ticketNumber?: string;
  status?: string;
  peopleAhead?: number;
  at: string;
  payload?: unknown;
}

type Listener = (event: QueueRealtimeEvent) => void;

const listeners = new Set<Listener>();

export function onQueueRealtimeEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitQueueRealtimeEvent(event: QueueRealtimeEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      if (__DEV__) {
        console.warn('[realtime-events] listener error', error);
      }
    }
  }
}

/** Derive notification-ready events from a ticket row change. */
export function emitTicketStatusEvents(input: {
  ticketId: string;
  queueId?: string | null;
  organizationId?: string | null;
  ticketNumber?: string | null;
  status?: string | null;
  previousStatus?: string | null;
  peopleAhead?: number | null;
  payload?: unknown;
}): void {
  const at = new Date().toISOString();
  const base = {
    ticketId: input.ticketId,
    queueId: input.queueId ?? undefined,
    organizationId: input.organizationId ?? undefined,
    ticketNumber: input.ticketNumber ?? undefined,
    status: input.status ?? undefined,
    peopleAhead: input.peopleAhead ?? undefined,
    at,
    payload: input.payload,
  };

  emitQueueRealtimeEvent({ type: 'TICKET_CHANGED', ...base });

  const status = (input.status ?? '').toLowerCase();
  const prev = (input.previousStatus ?? '').toLowerCase();
  if (status && status !== prev) {
    if (status === 'called') {
      emitQueueRealtimeEvent({ type: 'TICKET_CALLED', ...base });
    } else if (status === 'serving') {
      emitQueueRealtimeEvent({ type: 'TICKET_SERVING', ...base });
    } else if (status === 'served' || status === 'completed') {
      emitQueueRealtimeEvent({ type: 'TICKET_SERVED', ...base });
    } else if (status === 'skipped' || status === 'missed') {
      emitQueueRealtimeEvent({ type: 'TICKET_SKIPPED', ...base });
    } else if (status === 'cancelled') {
      emitQueueRealtimeEvent({ type: 'TICKET_CANCELLED', ...base });
    }
  }

  if (
    typeof input.peopleAhead === 'number' &&
    input.peopleAhead <= 1 &&
    (status === 'waiting' || status === 'almost')
  ) {
    emitQueueRealtimeEvent({ type: 'QUEUE_TURN_APPROACHING', ...base });
  }
}

/** Derive notification-ready events from a queue row change. */
export function emitQueueStatusEvents(input: {
  queueId: string;
  organizationId?: string | null;
  status?: string | null;
  previousStatus?: string | null;
  payload?: unknown;
}): void {
  const at = new Date().toISOString();
  const base = {
    queueId: input.queueId,
    organizationId: input.organizationId ?? undefined,
    status: input.status ?? undefined,
    at,
    payload: input.payload,
  };

  emitQueueRealtimeEvent({ type: 'QUEUE_UPDATED', ...base });

  const status = normalizeQueueStatus(input.status);
  const prev = normalizeQueueStatus(input.previousStatus);
  if (status && status !== prev) {
    if (status === 'paused') {
      emitQueueRealtimeEvent({ type: 'QUEUE_PAUSED', ...base });
    } else if (status === 'closed') {
      emitQueueRealtimeEvent({ type: 'QUEUE_CLOSED', ...base });
    } else if (
      (status === 'open' || status === 'active') &&
      prev === 'paused'
    ) {
      emitQueueRealtimeEvent({ type: 'QUEUE_RESUMED', ...base });
    }
  }
}

function normalizeQueueStatus(value?: string | null): string {
  const s = (value ?? '').toLowerCase();
  if (s === 'active') return 'open';
  return s;
}
