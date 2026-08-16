/**
 * Customer queue actions. Mutations run only from a client-confirmed request.
 * Gemini tool calls prepare confirmation — they never call join_queue / cancel_my_ticket.
 * All validation is server-side with the caller's JWT (RLS + SECURITY DEFINER RPCs).
 */

import type { ReplyStyle } from './reply-style.ts';
import type {
  PendingAction,
  TicketCard,
  ToolContext,
} from './types.ts';
import {
  ACTIVE_TICKET_STATUSES,
  CANCELLABLE_TICKET_STATUSES,
  UUID_RE,
} from './types.ts';

export type ActionErrorCode =
  | 'invalid_ids'
  | 'missing_organization'
  | 'missing_service'
  | 'organization_unavailable'
  | 'service_unavailable'
  | 'department_unavailable'
  | 'queue_closed'
  | 'queue_paused'
  | 'queue_unavailable'
  | 'already_joined'
  | 'no_active_ticket'
  | 'multiple_tickets'
  | 'cannot_cancel'
  | 'already_served'
  | 'ticket_not_found'
  | 'unauthorized'
  | 'unknown';

type OrgLite = {
  id: string;
  name: string;
  is_active: boolean;
  status: string;
  subscription_status: string;
};

type ServiceBundle = {
  serviceId: string;
  serviceName: string;
  serviceActive: boolean;
  departmentId: string;
  departmentName: string;
  departmentActive: boolean;
  org: OrgLite;
};

type JoinPreview = {
  queueId: string | null;
  queueStatus: string | null;
  waitingCount: number;
  estimatedWaitMinutes: number;
  canJoin: boolean;
  currentServing: string | null;
};

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

function isPublicOrg(org: Partial<OrgLite> | null | undefined): boolean {
  return Boolean(
    org &&
      org.subscription_status === 'active' &&
      org.is_active === true &&
      org.status === 'active',
  );
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapTicketPayload(raw: unknown): TicketCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const id = typeof p.id === 'string' ? p.id : '';
  if (!id) return null;
  return {
    id,
    ticketNumber: String(p.ticketNumber ?? ''),
    organizationName: String(p.organizationName ?? p.locationName ?? ''),
    organizationId: String(p.organizationId ?? ''),
    serviceName: String(p.serviceName ?? ''),
    departmentName: String(p.departmentName ?? ''),
    status: String(p.status ?? 'waiting'),
    position: Number(p.position ?? 0),
    peopleAhead: Number(p.peopleAhead ?? 0),
    estimatedWaitMinutes: Number(p.estimatedWaitMinutes ?? 0),
    currentServing: String(p.currentServing ?? '—'),
    queueStatus: typeof p.queueStatus === 'string' ? p.queueStatus : null,
  };
}

function extractErrorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error !== 'object') return '';
  const row = error as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };
  return [row.message, row.details, row.hint, row.code]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ');
}

function mapRpcError(error: unknown): ActionErrorCode {
  const text = extractErrorText(error).toUpperCase();
  if (text.includes('UNAUTHORIZED')) return 'unauthorized';
  if (text.includes('ALREADY_JOINED')) return 'already_joined';
  if (text.includes('QUEUE_PAUSED')) return 'queue_paused';
  if (text.includes('QUEUE_CLOSED')) return 'queue_closed';
  if (text.includes('QUEUE_UNAVAILABLE')) return 'queue_unavailable';
  if (text.includes('SERVICE_INACTIVE') || text.includes('SERVICE_NOT_FOUND')) {
    return 'service_unavailable';
  }
  if (text.includes('DEPARTMENT_INACTIVE') || text.includes('DEPARTMENT_NOT_FOUND')) {
    return 'department_unavailable';
  }
  if (
    text.includes('ORGANIZATION_INACTIVE') ||
    text.includes('ORGANIZATION_NOT_FOUND')
  ) {
    return 'organization_unavailable';
  }
  if (text.includes('ALREADY_SERVED')) return 'already_served';
  if (text.includes('CANNOT_CANCEL')) return 'cannot_cancel';
  if (text.includes('PERMISSION_DENIED')) return 'ticket_not_found';
  if (text.includes('TICKET_NOT_FOUND') || text.includes('ENTRY_NOT_FOUND')) {
    return 'ticket_not_found';
  }
  return 'unknown';
}

function parseAlreadyJoinedTicketId(error: unknown): string | null {
  const text = extractErrorText(error);
  const match = text.match(/ALREADY_JOINED:([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

function customerMessage(style: ReplyStyle, code: ActionErrorCode): string {
  const copy: Record<ActionErrorCode, Record<ReplyStyle, string>> = {
    invalid_ids: {
      english: 'I could not use those details. Please pick a business and service from the results.',
      roman_urdu:
        'Yeh details use nahi ho sakin. Results se business aur service choose karein.',
      urdu_script:
        'یہ تفصیلات استعمال نہیں ہو سکیں۔ نتائج سے کاروبار اور سروس منتخب کریں۔',
    },
    missing_organization: {
      english: 'Which business would you like to join?',
      roman_urdu: 'Aap kis business mein join hona chahte hain?',
      urdu_script: 'آپ کس کاروبار میں شامل ہونا چاہتے ہیں؟',
    },
    missing_service: {
      english: 'Which service would you like to join the queue for?',
      roman_urdu: 'Aap kaunsi service ke liye queue join karna chahte hain?',
      urdu_script: 'آپ کس سروس کی قطار میں شامل ہونا چاہتے ہیں؟',
    },
    organization_unavailable: {
      english: 'This business is not available for customers right now.',
      roman_urdu: 'Ye business abhi customers ke liye available nahi hai.',
      urdu_script: 'یہ کاروبار ابھی گاہکوں کے لیے دستیاب نہیں ہے۔',
    },
    service_unavailable: {
      english: 'This service is not available right now.',
      roman_urdu: 'Ye service abhi available nahi hai.',
      urdu_script: 'یہ سروس ابھی دستیاب نہیں ہے۔',
    },
    department_unavailable: {
      english: 'This department is not available right now.',
      roman_urdu: 'Ye department abhi available nahi hai.',
      urdu_script: 'یہ ڈیپارٹمنٹ ابھی دستیاب نہیں ہے۔',
    },
    queue_closed: {
      english: 'This queue is closed. You cannot join it right now.',
      roman_urdu: 'Ye queue abhi band hai. Aap is waqt is mein join nahi ho sakte.',
      urdu_script: 'یہ قطار ابھی بند ہے۔ آپ اس وقت اس میں شامل نہیں ہو سکتے۔',
    },
    queue_paused: {
      english: 'This queue is paused. Please try again later.',
      roman_urdu: 'Ye queue abhi pause hai. Thori der baad try karein.',
      urdu_script: 'یہ قطار فی الحال رک گئی ہے۔ براہ کرم کچھ دیر بعد کوشش کریں۔',
    },
    queue_unavailable: {
      english: 'This queue is not available right now.',
      roman_urdu: 'Ye queue abhi available nahi hai.',
      urdu_script: 'یہ قطار ابھی دستیاب نہیں ہے۔',
    },
    already_joined: {
      english:
        'You already have an active ticket. You can view it before joining another queue.',
      roman_urdu:
        'Aap ke paas pehle se active ticket hai. Dusri queue join karne se pehle usay dekh lein.',
      urdu_script:
        'آپ کے پاس پہلے سے فعال ٹکٹ ہے۔ دوسری قطار میں شامل ہونے سے پہلے اسے دیکھ لیں۔',
    },
    no_active_ticket: {
      english: 'You do not have an active ticket right now.',
      roman_urdu: 'Aap ke paas abhi koi active ticket nahi hai.',
      urdu_script: 'آپ کے پاس ابھی کوئی فعال ٹکٹ نہیں ہے۔',
    },
    multiple_tickets: {
      english: 'You have more than one active ticket. Which one should I cancel?',
      roman_urdu: 'Aap ke paas ek se zyada active tickets hain. Kaunsi cancel karon?',
      urdu_script: 'آپ کے پاس ایک سے زیادہ فعال ٹکٹ ہیں۔ کون سی منسوخ کروں؟',
    },
    cannot_cancel: {
      english: 'This ticket can no longer be cancelled.',
      roman_urdu: 'Ye ticket ab cancel nahi ho sakti.',
      urdu_script: 'یہ ٹکٹ اب منسوخ نہیں ہو سکتی۔',
    },
    already_served: {
      english: 'This ticket has already been served.',
      roman_urdu: 'Ye ticket pehle hi serve ho chuki hai.',
      urdu_script: 'یہ ٹکٹ پہلے ہی مکمل ہو چکی ہے۔',
    },
    ticket_not_found: {
      english: 'That ticket was not found, or it is not yours.',
      roman_urdu: 'Ye ticket nahi mili, ya ye aap ki nahi hai.',
      urdu_script: 'یہ ٹکٹ نہیں ملی، یا یہ آپ کی نہیں ہے۔',
    },
    unauthorized: {
      english: 'Your session has expired. Please log in again.',
      roman_urdu: 'Aap ka session expire ho gaya hai. Please dobara login karein.',
      urdu_script: 'آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ ان کریں۔',
    },
    unknown: {
      english: 'Something went wrong. Please try again.',
      roman_urdu: 'Kuch ghalat ho gaya. Dobara try karein.',
      urdu_script: 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
    },
  };
  return copy[code][style];
}

function actionLabels(
  style: ReplyStyle,
  type: 'join_queue' | 'cancel_ticket',
): PendingAction['labels'] {
  if (type === 'join_queue') {
    if (style === 'urdu_script') {
      return { confirm: 'تصدیق کریں اور قطار میں شامل ہوں', dismiss: 'منسوخ' };
    }
    if (style === 'roman_urdu') {
      return { confirm: 'Confirm & Join Queue', dismiss: 'Cancel' };
    }
    return { confirm: 'Confirm & Join Queue', dismiss: 'Cancel' };
  }
  if (style === 'urdu_script') {
    return { confirm: 'ہاں، ٹکٹ منسوخ کریں', dismiss: 'ٹکٹ رکھیں' };
  }
  if (style === 'roman_urdu') {
    return { confirm: 'Yes, Cancel Ticket', dismiss: 'Keep Ticket' };
  }
  return { confirm: 'Yes, Cancel Ticket', dismiss: 'Keep Ticket' };
}

function joinSuccessMessage(style: ReplyStyle, ticket: TicketCard): string {
  const wait = Number.isFinite(ticket.estimatedWaitMinutes)
    ? ticket.estimatedWaitMinutes
    : 0;
  const ahead = Number.isFinite(ticket.peopleAhead) ? ticket.peopleAhead : 0;
  if (style === 'urdu_script') {
    return [
      `ہو گیا! 🎉 آپ کامیابی سے ${ticket.organizationName} کی قطار میں شامل ہو گئے ہیں۔`,
      '',
      `ٹکٹ: #${ticket.ticketNumber}`,
      `سروس: ${ticket.serviceName}`,
      `آپ سے پہلے: ${ahead} گاہک`,
      `اندازاً انتظار: ${wait} منٹ`,
      '',
      'جب آپ کی باری قریب ہوگی، میری باری آپ کو نوٹیفکیشن بھیج دے گی۔',
    ].join('\n').trim();
  }
  if (style === 'roman_urdu') {
    return [
      `Done! 🎉 Aap successfully ${ticket.organizationName} ki queue mein join ho gaye hain.`,
      '',
      `Ticket: #${ticket.ticketNumber}`,
      `Service: ${ticket.serviceName}`,
      `Aap se pehle: ${ahead} customers`,
      `Estimated wait: ${wait} minutes`,
      '',
      'Jab aap ki bari qareeb hogi, MeriBaari aap ko notification bhej dega.',
    ].join('\n');
  }
  return [
    `Done! 🎉 You've successfully joined the queue at ${ticket.organizationName}.`,
    '',
    `Ticket: #${ticket.ticketNumber}`,
    `Service: ${ticket.serviceName}`,
    `People ahead: ${ahead}`,
    `Estimated wait: ${wait} minutes`,
    '',
    'When your turn is close, MeriBaari will send you a notification.',
  ].join('\n');
}

function cancelSuccessMessage(style: ReplyStyle, ticket: TicketCard): string {
  if (style === 'urdu_script') {
    return `ہو گیا۔ آپ کا ٹکٹ #${ticket.ticketNumber} منسوخ ہو گیا ہے۔`;
  }
  if (style === 'roman_urdu') {
    return `Done. Aap ka ticket #${ticket.ticketNumber} cancel ho gaya hai.`;
  }
  return `Done. Your ticket #${ticket.ticketNumber} has been cancelled.`;
}

function joinConfirmSuggestion(
  style: ReplyStyle,
  preview: {
    organizationName: string;
    serviceName: string;
    waitingCount: number;
    estimatedWaitMinutes: number;
  },
): string {
  if (style === 'urdu_script') {
    return [
      `میں آپ کو ${preview.organizationName} کی ${preview.serviceName} قطار میں شامل کرنے والا ہوں۔`,
      '',
      `سروس: ${preview.serviceName}`,
      `کاروبار: ${preview.organizationName}`,
      `موجودہ انتظار: ${preview.waitingCount} گاہک`,
      `اندازاً انتظار: ${preview.estimatedWaitMinutes} منٹ`,
      '',
      'کیا آپ تصدیق کرنا چاہتے ہیں؟',
    ].join('\n');
  }
  if (style === 'roman_urdu') {
    return [
      `Main aap ko ${preview.organizationName} ke ${preview.serviceName} queue mein join karne wala hoon.`,
      '',
      `Service: ${preview.serviceName}`,
      `Business: ${preview.organizationName}`,
      `Current waiting customers: ${preview.waitingCount}`,
      `Estimated wait: ${preview.estimatedWaitMinutes} minutes`,
      '',
      'Kya aap confirm karna chahte hain?',
    ].join('\n');
  }
  return [
    `I am about to join you in the ${preview.serviceName} queue at ${preview.organizationName}.`,
    '',
    `Service: ${preview.serviceName}`,
    `Business: ${preview.organizationName}`,
    `Current waiting customers: ${preview.waitingCount}`,
    `Estimated wait: ${preview.estimatedWaitMinutes} minutes`,
    '',
    'Do you want to confirm?',
  ].join('\n');
}

function cancelConfirmSuggestion(style: ReplyStyle, ticket: TicketCard): string {
  if (style === 'urdu_script') {
    return [
      'آپ کا فعال ٹکٹ:',
      '',
      `کاروبار: ${ticket.organizationName}`,
      `سروس: ${ticket.serviceName}`,
      `ٹکٹ: #${ticket.ticketNumber}`,
      '',
      'کیا آپ اس ٹکٹ کو منسوخ کرنا چاہتے ہیں؟',
    ].join('\n');
  }
  if (style === 'roman_urdu') {
    return [
      'Aap ka active ticket:',
      '',
      `Business: ${ticket.organizationName}`,
      `Service: ${ticket.serviceName}`,
      `Ticket: #${ticket.ticketNumber}`,
      '',
      'Kya aap is ticket ko cancel karna chahte hain?',
    ].join('\n');
  }
  return [
    'Your active ticket:',
    '',
    `Business: ${ticket.organizationName}`,
    `Service: ${ticket.serviceName}`,
    `Ticket: #${ticket.ticketNumber}`,
    '',
    'Do you want to cancel this ticket?',
  ].join('\n');
}

function fail(
  ctx: ToolContext,
  code: ActionErrorCode,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  ctx.ui.pendingAction = null;
  ctx.ui.actionResult = { ok: false, code };
  return {
    error: code,
    needsConfirmation: false,
    created: false,
    cancelled: false,
    message: customerMessage(ctx.replyStyle, code),
    ...extra,
  };
}

async function loadPublicOrg(
  ctx: ToolContext,
  organizationId: string,
): Promise<OrgLite | null> {
  const { data, error } = await ctx.supabase
    .from('organizations')
    .select('id, name, is_active, status, subscription_status')
    .eq('id', organizationId)
    .maybeSingle();
  if (error || !data) return null;
  const org = data as OrgLite;
  return isPublicOrg(org) ? org : null;
}

async function loadServiceBundle(
  ctx: ToolContext,
  serviceId: string,
): Promise<ServiceBundle | null> {
  const { data, error } = await ctx.supabase
    .from('services')
    .select(
      'id, name, is_active, status, departments!inner(id, name, is_active, status, organization_id, organizations!inner(id, name, is_active, status, subscription_status))',
    )
    .eq('id', serviceId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as {
    id: string;
    name: string;
    is_active: boolean;
    status: string;
    departments:
      | {
          id: string;
          name: string;
          is_active: boolean;
          status: string;
          organization_id: string;
          organizations: OrgLite | OrgLite[] | null;
        }
      | {
          id: string;
          name: string;
          is_active: boolean;
          status: string;
          organization_id: string;
          organizations: OrgLite | OrgLite[] | null;
        }[]
      | null;
  };

  const dept = unwrap(row.departments);
  const org = unwrap(dept?.organizations ?? null);
  if (!dept || !org) return null;

  return {
    serviceId: row.id,
    serviceName: row.name,
    serviceActive: row.is_active === true && row.status === 'active',
    departmentId: dept.id,
    departmentName: dept.name,
    departmentActive: dept.is_active === true && dept.status === 'active',
    org,
  };
}

async function listActiveServices(
  ctx: ToolContext,
  organizationId: string,
): Promise<Array<{ id: string; name: string; price: number | null }>> {
  const { data: departments } = await ctx.supabase
    .from('departments')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('status', 'active');
  const deptIds = (departments ?? []).map((row: { id: string }) => row.id);
  if (deptIds.length === 0) return [];

  const { data: services } = await ctx.supabase
    .from('services')
    .select('id, name, price')
    .in('department_id', deptIds)
    .eq('is_active', true)
    .eq('status', 'active')
    .order('display_order', { ascending: true });

  return (services ?? []).map(
    (row: { id: string; name: string; price: number | null }) => ({
      id: row.id,
      name: row.name,
      price: typeof row.price === 'number' ? row.price : null,
    }),
  );
}

async function loadJoinPreview(
  ctx: ToolContext,
  serviceId: string,
): Promise<{ preview: JoinPreview | null; errorCode: ActionErrorCode | null }> {
  const { data, error } = await ctx.supabase.rpc('get_queue_join_preview', {
    p_service_id: serviceId,
  });
  if (error) return { preview: null, errorCode: mapRpcError(error) };
  if (!data || typeof data !== 'object') {
    return { preview: null, errorCode: 'unknown' };
  }
  const row = data as Record<string, unknown>;
  const queueStatus = typeof row.queueStatus === 'string' ? row.queueStatus : null;
  const waitingCount = Number(row.waitingCount ?? 0);
  const estimatedWaitMinutes = Number(row.estimatedWaitMinutes ?? 0);
  const canJoin = row.canJoin === true;
  return {
    preview: {
      queueId: typeof row.queueId === 'string' ? row.queueId : null,
      queueStatus,
      waitingCount: Number.isFinite(waitingCount) ? waitingCount : 0,
      estimatedWaitMinutes: Number.isFinite(estimatedWaitMinutes)
        ? estimatedWaitMinutes
        : 0,
      canJoin,
      currentServing:
        typeof row.currentServing === 'string' ? row.currentServing : null,
    },
    errorCode: null,
  };
}

function queueUnavailableCode(preview: JoinPreview): ActionErrorCode | null {
  if (preview.canJoin) return null;
  const status = (preview.queueStatus ?? '').toLowerCase();
  if (status === 'paused') return 'queue_paused';
  if (status === 'closed') return 'queue_closed';
  return 'queue_unavailable';
}

async function findExistingQueueTicket(
  ctx: ToolContext,
  queueId: string | null,
): Promise<TicketCard | null> {
  if (!queueId) return null;
  const { data, error } = await ctx.supabase
    .from('tickets')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('queue_id', queueId)
    .in('status', [...ACTIVE_TICKET_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return loadTicketCard(ctx, (data as { id: string }).id);
}

async function alreadyJoinedResult(
  ctx: ToolContext,
  ticket: TicketCard,
): Promise<Record<string, unknown>> {
  ctx.ui.ticket = ticket;
  ctx.ui.pendingAction = null;
  ctx.ui.actionResult = { ok: false, code: 'already_joined' };
  return {
    error: 'already_joined',
    created: false,
    alreadyJoined: true,
    ticket,
    message: customerMessage(ctx.replyStyle, 'already_joined'),
  };
}

async function loadTicketCard(
  ctx: ToolContext,
  ticketId: string,
): Promise<TicketCard | null> {
  const { data } = await ctx.supabase.rpc('build_queue_ticket_payload', {
    p_ticket_id: ticketId,
  });
  return mapTicketPayload(data);
}

async function loadOwnCancellableTickets(ctx: ToolContext): Promise<TicketCard[]> {
  const { data, error } = await ctx.supabase
    .from('tickets')
    .select('id, status, created_at')
    .eq('user_id', ctx.userId)
    .in('status', [...CANCELLABLE_TICKET_STATUSES])
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !data) return [];

  const tickets: TicketCard[] = [];
  for (const row of data as Array<{ id: string }>) {
    const ticket = await loadTicketCard(ctx, row.id);
    if (!ticket) continue;
    if (ticket.status === 'waiting' || ticket.status === 'called' || ticket.status === 'almost') {
      tickets.push(ticket);
    }
  }
  return tickets;
}

async function loadOwnTicketForCancel(
  ctx: ToolContext,
  ticketId: string,
): Promise<{ ticket: TicketCard | null; errorCode: ActionErrorCode | null }> {
  const { data, error } = await ctx.supabase
    .from('tickets')
    .select('id, status, user_id')
    .eq('id', ticketId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (error) return { ticket: null, errorCode: 'unknown' };
  if (!data) return { ticket: null, errorCode: 'ticket_not_found' };

  const status = String((data as { status?: string }).status ?? '');
  if (status === 'served' || status === 'completed') {
    return { ticket: null, errorCode: 'already_served' };
  }
  if (status === 'cancelled' || status === 'skipped') {
    return { ticket: null, errorCode: 'cannot_cancel' };
  }
  if (status === 'serving') {
    return { ticket: null, errorCode: 'cannot_cancel' };
  }
  if (!CANCELLABLE_TICKET_STATUSES.includes(status as 'waiting' | 'called')) {
    return { ticket: null, errorCode: 'cannot_cancel' };
  }

  const ticket = await loadTicketCard(ctx, ticketId);
  if (!ticket) return { ticket: null, errorCode: 'ticket_not_found' };
  return { ticket, errorCode: null };
}

async function resolveJoinTarget(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<
  | { ok: true; bundle: ServiceBundle }
  | { ok: false; result: Record<string, unknown> }
> {
  const organizationId = isUuid(args.organizationId)
    ? args.organizationId.trim()
    : '';
  const serviceId = isUuid(args.serviceId) ? args.serviceId.trim() : '';

  if (!organizationId && !serviceId) {
    return { ok: false, result: fail(ctx, 'missing_organization') };
  }

  if (organizationId && !serviceId) {
    const org = await loadPublicOrg(ctx, organizationId);
    if (!org) return { ok: false, result: fail(ctx, 'organization_unavailable') };
    const services = await listActiveServices(ctx, organizationId);
    if (services.length === 0) {
      return { ok: false, result: fail(ctx, 'service_unavailable') };
    }
    ctx.ui.pendingAction = null;
    return {
      ok: false,
      result: {
        error: 'missing_service',
        needsConfirmation: false,
        created: false,
        message: customerMessage(ctx.replyStyle, 'missing_service'),
        organizationId: org.id,
        organizationName: org.name,
        services,
      },
    };
  }

  if (!isUuid(serviceId)) {
    return { ok: false, result: fail(ctx, 'invalid_ids') };
  }

  const bundle = await loadServiceBundle(ctx, serviceId);
  if (!bundle) return { ok: false, result: fail(ctx, 'service_unavailable') };
  if (!isPublicOrg(bundle.org)) {
    return { ok: false, result: fail(ctx, 'organization_unavailable') };
  }
  if (organizationId && bundle.org.id !== organizationId) {
    return { ok: false, result: fail(ctx, 'invalid_ids') };
  }
  if (!bundle.serviceActive) {
    return { ok: false, result: fail(ctx, 'service_unavailable') };
  }
  if (!bundle.departmentActive) {
    return { ok: false, result: fail(ctx, 'department_unavailable') };
  }

  return { ok: true, bundle };
}

function toPendingJoin(
  ctx: ToolContext,
  bundle: ServiceBundle,
  preview: JoinPreview,
): PendingAction {
  return {
    type: 'join_queue',
    organizationId: bundle.org.id,
    organizationName: bundle.org.name,
    serviceId: bundle.serviceId,
    serviceName: bundle.serviceName,
    ticketId: null,
    ticketNumber: null,
    waitingCount: preview.waitingCount,
    estimatedWaitMinutes: preview.estimatedWaitMinutes,
    queueStatus: preview.queueStatus,
    labels: actionLabels(ctx.replyStyle, 'join_queue'),
  };
}

function toPendingCancel(ctx: ToolContext, ticket: TicketCard): PendingAction {
  return {
    type: 'cancel_ticket',
    organizationId: ticket.organizationId,
    organizationName: ticket.organizationName,
    serviceId: null,
    serviceName: ticket.serviceName,
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    waitingCount: ticket.peopleAhead,
    estimatedWaitMinutes: ticket.estimatedWaitMinutes,
    queueStatus: ticket.queueStatus,
    labels: actionLabels(ctx.replyStyle, 'cancel_ticket'),
  };
}

/**
 * Gemini tool: validate + preview only. Does not create a ticket.
 */
export async function prepareJoinQueue(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved = await resolveJoinTarget(ctx, args);
  if (!resolved.ok) return resolved.result;

  const { preview, errorCode } = await loadJoinPreview(
    ctx,
    resolved.bundle.serviceId,
  );
  if (errorCode) return fail(ctx, errorCode);
  if (!preview) return fail(ctx, 'unknown');

  const blocked = queueUnavailableCode(preview);
  if (blocked) return fail(ctx, blocked);

  const existing = await findExistingQueueTicket(ctx, preview.queueId);
  if (existing) return alreadyJoinedResult(ctx, existing);

  const pending = toPendingJoin(ctx, resolved.bundle, preview);
  ctx.ui.pendingAction = pending;
  ctx.ui.actionResult = undefined;

  const suggestedReply = joinConfirmSuggestion(ctx.replyStyle, {
    organizationName: pending.organizationName,
    serviceName: pending.serviceName,
    waitingCount: preview.waitingCount,
    estimatedWaitMinutes: preview.estimatedWaitMinutes,
  });

  return {
    needsConfirmation: true,
    created: false,
    doNotCreateTicket: true,
    instruction:
      'Do not claim the customer has joined. Ask them to tap Confirm & Join Queue. Never invent ticket numbers.',
    preview: {
      organizationId: pending.organizationId,
      organizationName: pending.organizationName,
      serviceId: pending.serviceId,
      serviceName: pending.serviceName,
      waitingCount: preview.waitingCount,
      estimatedWaitMinutes: preview.estimatedWaitMinutes,
      queueStatus: preview.queueStatus,
      currentServing: preview.currentServing,
      canJoin: true,
    },
    suggestedReply,
    message: suggestedReply,
  };
}

/**
 * Gemini tool: look up the customer's own cancellable ticket and ask for confirmation.
 * Does not cancel.
 */
export async function prepareCancelTicket(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const ticketId = isUuid(args.ticketId) ? args.ticketId.trim() : '';

  if (ticketId) {
    const loaded = await loadOwnTicketForCancel(ctx, ticketId);
    if (loaded.errorCode) return fail(ctx, loaded.errorCode);
    if (!loaded.ticket) return fail(ctx, 'ticket_not_found');
    return setCancelPending(ctx, loaded.ticket);
  }

  const tickets = await loadOwnCancellableTickets(ctx);
  if (tickets.length === 0) {
    const { data } = await ctx.supabase
      .from('tickets')
      .select('id, status')
      .eq('user_id', ctx.userId)
      .in('status', [...ACTIVE_TICKET_STATUSES])
      .limit(5);
    const serving = (data ?? []).some(
      (row: { status?: string }) => row.status === 'serving',
    );
    return fail(ctx, serving ? 'cannot_cancel' : 'no_active_ticket');
  }
  if (tickets.length > 1) {
    ctx.ui.pendingAction = null;
    return {
      error: 'multiple_tickets',
      needsConfirmation: false,
      cancelled: false,
      message: customerMessage(ctx.replyStyle, 'multiple_tickets'),
      tickets: tickets.map((ticket) => ({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        organizationName: ticket.organizationName,
        serviceName: ticket.serviceName,
        status: ticket.status,
      })),
    };
  }

  return setCancelPending(ctx, tickets[0]);
}

function setCancelPending(
  ctx: ToolContext,
  ticket: TicketCard,
): Record<string, unknown> {
  const pending = toPendingCancel(ctx, ticket);
  ctx.ui.pendingAction = pending;
  ctx.ui.actionResult = undefined;
  const suggestedReply = cancelConfirmSuggestion(ctx.replyStyle, ticket);
  return {
    needsConfirmation: true,
    cancelled: false,
    doNotCancelYet: true,
    instruction:
      'Do not claim the ticket was cancelled. Ask the customer to tap Yes, Cancel Ticket.',
    ticket,
    suggestedReply,
    message: suggestedReply,
  };
}

export async function executeJoinQueue(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved = await resolveJoinTarget(ctx, args);
  if (!resolved.ok) return resolved.result;

  const { preview, errorCode } = await loadJoinPreview(
    ctx,
    resolved.bundle.serviceId,
  );
  if (errorCode) return fail(ctx, errorCode);
  if (!preview) return fail(ctx, 'unknown');
  const blocked = queueUnavailableCode(preview);
  if (blocked) return fail(ctx, blocked);

  const existing = await findExistingQueueTicket(ctx, preview.queueId);
  if (existing) return alreadyJoinedResult(ctx, existing);

  const { data, error } = await ctx.supabase.rpc('join_queue', {
    p_service_id: resolved.bundle.serviceId,
  });

  if (error) {
    const code = mapRpcError(error);
    if (code === 'already_joined') {
      const existingId = parseAlreadyJoinedTicketId(error);
      if (existingId) {
        const existing = await loadTicketCard(ctx, existingId);
        if (existing) {
          ctx.ui.ticket = existing;
          ctx.ui.pendingAction = null;
          ctx.ui.actionResult = { ok: false, code };
          return {
            error: code,
            created: false,
            alreadyJoined: true,
            ticket: existing,
            message: customerMessage(ctx.replyStyle, code),
          };
        }
      }
    }
    return fail(ctx, code);
  }

  const ticket = mapTicketPayload(data);
  if (!ticket) return fail(ctx, 'unknown');

  ctx.ui.ticket = ticket;
  ctx.ui.pendingAction = null;
  ctx.ui.actionResult = { ok: true, code: 'joined' };
  const message = joinSuccessMessage(ctx.replyStyle, ticket);
  return {
    created: true,
    needsConfirmation: false,
    ticket,
    message,
  };
}

export async function executeCancelTicket(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const ticketId = isUuid(args.ticketId) ? args.ticketId.trim() : '';
  if (!ticketId) return fail(ctx, 'invalid_ids');

  const loaded = await loadOwnTicketForCancel(ctx, ticketId);
  if (loaded.errorCode) return fail(ctx, loaded.errorCode);
  if (!loaded.ticket) return fail(ctx, 'ticket_not_found');

  const { data, error } = await ctx.supabase.rpc('cancel_my_ticket', {
    p_ticket_id: ticketId,
  });

  if (error) return fail(ctx, mapRpcError(error));

  const ticket = mapTicketPayload(data);
  if (!ticket) return fail(ctx, 'unknown');

  ctx.ui.ticket = ticket;
  ctx.ui.pendingAction = null;
  ctx.ui.actionResult = { ok: true, code: 'cancelled' };
  const message = cancelSuccessMessage(ctx.replyStyle, ticket);
  return {
    cancelled: true,
    needsConfirmation: false,
    ticket,
    message,
  };
}

export function parseConfirmedAction(raw: unknown): {
  name: 'joinQueue' | 'cancelTicket';
  organizationId?: string;
  serviceId?: string;
  ticketId?: string;
} | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const name = row.name;
  if (name === 'joinQueue') {
    if (!isUuid(row.organizationId) || !isUuid(row.serviceId)) return null;
    return {
      name,
      organizationId: row.organizationId.trim(),
      serviceId: row.serviceId.trim(),
    };
  }
  if (name === 'cancelTicket') {
    if (!isUuid(row.ticketId)) return null;
    return { name, ticketId: row.ticketId.trim() };
  }
  return null;
}

export function actionResponseMessage(
  result: Record<string, unknown>,
  fallbackStyle: ReplyStyle,
): string {
  if (typeof result.message === 'string' && result.message.trim()) {
    return result.message.trim();
  }
  return customerMessage(fallbackStyle, 'unknown');
}
