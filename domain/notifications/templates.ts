import type { NotificationType } from '@/domain/models/notification';

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  eventKey: string;
  ticketId?: string | null;
  queueId?: string | null;
  organizationId?: string | null;
}

export interface NotificationTemplateContext {
  organizationName?: string;
  ticketNumber?: string;
  ticketId?: string | null;
  queueId?: string | null;
  organizationId?: string | null;
  eventSuffix?: string;
}

function orgName(ctx: NotificationTemplateContext): string {
  return ctx.organizationName?.trim() || 'the organization';
}

function ticketLabel(ctx: NotificationTemplateContext): string {
  return ctx.ticketNumber?.trim() || 'your ticket';
}

export function createQueueJoinedNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const ticketId = ctx.ticketId ?? 'unknown';
  return {
    type: 'QUEUE_JOINED',
    title: 'Queue Joined',
    message: `You joined the queue at ${orgName(ctx)}.`,
    eventKey: `QUEUE_JOINED:${ticketId}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createTicketCalledNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const ticketId = ctx.ticketId ?? 'unknown';
  const suffix = ctx.eventSuffix ?? 'call';
  return {
    type: 'TICKET_CALLED',
    title: 'Your Turn',
    message: `Your ticket ${ticketLabel(ctx)} has been called. Please proceed to the service counter.`,
    eventKey: `TICKET_CALLED:${ticketId}:${suffix}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createTicketServingNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const ticketId = ctx.ticketId ?? 'unknown';
  return {
    type: 'TICKET_SERVING',
    title: 'Now Serving',
    message: 'You are now being served.',
    eventKey: `TICKET_SERVING:${ticketId}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createTicketServedNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const ticketId = ctx.ticketId ?? 'unknown';
  return {
    type: 'TICKET_SERVED',
    title: 'Service Completed',
    message: `Your service at ${orgName(ctx)} has been completed.`,
    eventKey: `TICKET_SERVED:${ticketId}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createTicketSkippedNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const ticketId = ctx.ticketId ?? 'unknown';
  return {
    type: 'TICKET_SKIPPED',
    title: 'Ticket Skipped',
    message: `Your ticket ${ticketLabel(ctx)} was skipped. Please speak with staff if you still need service.`,
    eventKey: `TICKET_SKIPPED:${ticketId}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createQueuePausedNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const queueId = ctx.queueId ?? 'unknown';
  const suffix = ctx.eventSuffix ?? 'paused';
  return {
    type: 'QUEUE_PAUSED',
    title: 'Queue Paused',
    message: `The queue at ${orgName(ctx)} has been temporarily paused.`,
    eventKey: `QUEUE_PAUSED:${queueId}:${ctx.ticketId ?? 'all'}:${suffix}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createQueueResumedNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const queueId = ctx.queueId ?? 'unknown';
  const suffix = ctx.eventSuffix ?? 'resumed';
  return {
    type: 'QUEUE_RESUMED',
    title: 'Queue Resumed',
    message: `The queue at ${orgName(ctx)} has resumed.`,
    eventKey: `QUEUE_RESUMED:${queueId}:${ctx.ticketId ?? 'all'}:${suffix}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createQueueClosedNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const queueId = ctx.queueId ?? 'unknown';
  const suffix = ctx.eventSuffix ?? 'closed';
  return {
    type: 'QUEUE_CLOSED',
    title: 'Queue Closed',
    message: `The queue at ${orgName(ctx)} has been closed.`,
    eventKey: `QUEUE_CLOSED:${queueId}:${ctx.ticketId ?? 'all'}:${suffix}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createTurnApproachingNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const ticketId = ctx.ticketId ?? 'unknown';
  return {
    type: 'QUEUE_TURN_APPROACHING',
    title: 'Your Turn Is Near',
    message: `You are almost next at ${orgName(ctx)}.`,
    eventKey: `QUEUE_TURN_APPROACHING:${ticketId}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createQueueCancelledNotification(
  ctx: NotificationTemplateContext,
): NotificationTemplate {
  const ticketId = ctx.ticketId ?? ctx.queueId ?? 'unknown';
  const suffix = ctx.eventSuffix ?? 'cancelled';
  return {
    type: 'QUEUE_CANCELLED',
    title: 'Queue Cancelled',
    message: `Your active ticket at ${orgName(ctx)} is no longer valid because the queue closed.`,
    eventKey: `QUEUE_CANCELLED:${ticketId}:${suffix}`,
    ticketId: ctx.ticketId ?? null,
    queueId: ctx.queueId ?? null,
    organizationId: ctx.organizationId ?? null,
  };
}

export function createSystemNotification(
  title: string,
  message: string,
  eventKey: string,
): NotificationTemplate {
  return {
    type: 'SYSTEM',
    title,
    message,
    eventKey,
    ticketId: null,
    queueId: null,
    organizationId: null,
  };
}
