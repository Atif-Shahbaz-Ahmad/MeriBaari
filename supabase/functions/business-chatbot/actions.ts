/**
 * Business queue mutations. Skip and close only run after a client-confirmed request.
 * Call next, pause, resume, and serve run immediately via existing RPCs.
 * Ownership is enforced by resolving the owner's org first, then asserting queue.organization_id.
 */

import type { ReplyStyle } from '../_shared/chatbot/reply-style.ts';
import { loadOwnedQueue, mapQueueStatus, requireOrg } from './ownership.ts';
import type {
  ConfirmedAction,
  PendingAction,
  ToolContext,
  WaitingCustomerCard,
} from './types.ts';
import { UUID_RE } from './types.ts';

export type ActionErrorCode =
  | 'no_organization'
  | 'no_queue'
  | 'multiple_queues'
  | 'queue_not_found'
  | 'no_customers_waiting'
  | 'no_current_customer'
  | 'queue_paused'
  | 'queue_closed'
  | 'already_paused'
  | 'already_open'
  | 'already_closed'
  | 'invalid_ids'
  | 'unauthorized'
  | 'unknown';

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
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
  if (text.includes('UNAUTHORIZED') || text.includes('PERMISSION_DENIED')) {
    return 'unauthorized';
  }
  if (text.includes('NO_CUSTOMERS_WAITING')) return 'no_customers_waiting';
  if (text.includes('ENTRY_NOT_FOUND')) return 'no_current_customer';
  if (text.includes('INVALID_STATUS')) return 'unknown';
  return 'unknown';
}

function ownerMessage(style: ReplyStyle, code: ActionErrorCode): string {
  const copy: Record<ActionErrorCode, Record<ReplyStyle, string>> = {
    no_organization: {
      english: 'You do not have a registered business yet.',
      roman_urdu: 'Aap ka abhi koi business registered nahi hai.',
      urdu_script: 'آپ کا ابھی کوئی کاروبار رجسٹرڈ نہیں ہے۔',
    },
    no_queue: {
      english: 'You do not have an active queue yet.',
      roman_urdu: 'Aap ki abhi koi active queue nahi hai.',
      urdu_script: 'آپ کی ابھی کوئی فعال قطار نہیں ہے۔',
    },
    multiple_queues: {
      english: 'You have more than one queue. Which service queue should I use?',
      roman_urdu: 'Aap ki ek se zyada queues hain. Kaunsi service ki queue use karun?',
      urdu_script: 'آپ کی ایک سے زیادہ قطاریں ہیں۔ کس سروس کی قطار استعمال کروں؟',
    },
    queue_not_found: {
      english: 'That queue was not found in your business.',
      roman_urdu: 'Ye queue aap ke business mein nahi mili.',
      urdu_script: 'یہ قطار آپ کے کاروبار میں نہیں ملی۔',
    },
    no_customers_waiting: {
      english: 'There are no customers waiting in this queue.',
      roman_urdu: 'Is queue mein koi customer wait nahi kar raha.',
      urdu_script: 'اس قطار میں کوئی گاہک انتظار نہیں کر رہا۔',
    },
    no_current_customer: {
      english: 'There is no customer currently being served or called.',
      roman_urdu: 'Abhi koi customer serve/call nahi ho raha.',
      urdu_script: 'ابھی کوئی گاہک سروی یا کال نہیں ہو رہا۔',
    },
    queue_paused: {
      english: 'This queue is paused.',
      roman_urdu: 'Ye queue abhi pause hai.',
      urdu_script: 'یہ قطار فی الحال رک گئی ہے۔',
    },
    queue_closed: {
      english: 'This queue is closed.',
      roman_urdu: 'Ye queue band hai.',
      urdu_script: 'یہ قطار بند ہے۔',
    },
    already_paused: {
      english: 'This queue is already paused.',
      roman_urdu: 'Ye queue pehle se pause hai.',
      urdu_script: 'یہ قطار پہلے سے رک گئی ہے۔',
    },
    already_open: {
      english: 'This queue is already open.',
      roman_urdu: 'Ye queue pehle se open hai.',
      urdu_script: 'یہ قطار پہلے سے کھلی ہے۔',
    },
    already_closed: {
      english: 'This queue is already closed.',
      roman_urdu: 'Ye queue pehle se band hai.',
      urdu_script: 'یہ قطار پہلے سے بند ہے۔',
    },
    invalid_ids: {
      english: 'I could not use those details. Please try again.',
      roman_urdu: 'Yeh details use nahi ho sakin. Dobara try karein.',
      urdu_script: 'یہ تفصیلات استعمال نہیں ہو سکیں۔ دوبارہ کوشش کریں۔',
    },
    unauthorized: {
      english: 'Your session has expired. Please log in again.',
      roman_urdu: 'Aap ka session expire ho gaya hai. Please dobara login karein.',
      urdu_script: 'آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ ان کریں۔',
    },
    unknown: {
      english: 'The queue operation failed. Please try again.',
      roman_urdu: 'Queue operation fail ho gaya. Dobara try karein.',
      urdu_script: 'قطار کی کارروائی ناکام ہو گئی۔ براہ کرم دوبارہ کوشش کریں۔',
    },
  };
  return copy[code][style];
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
    executed: false,
    needsConfirmation: false,
    message: ownerMessage(ctx.replyStyle, code),
    ...extra,
  };
}

export type QueueLite = {
  id: string;
  status: string;
  total_waiting: number;
  current_number: string;
  current_serving_number: string;
  average_service_time: number;
  service_id: string | null;
  department_id: string;
  serviceName: string;
  departmentName: string;
};

export async function listOwnedQueues(ctx: ToolContext): Promise<QueueLite[]> {
  if (!ctx.org) return [];
  const { data, error } = await ctx.supabase
    .from('queues')
    .select(
      'id, status, total_waiting, current_number, current_serving_number, average_service_time, service_id, department_id, departments(name), services(name)',
    )
    .eq('organization_id', ctx.org.id)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => {
    const dept = unwrap(row.departments as { name?: string } | { name?: string }[] | null);
    const service = unwrap(row.services as { name?: string } | { name?: string }[] | null);
    return {
      id: String(row.id),
      status: String(row.status ?? 'active'),
      total_waiting: Number(row.total_waiting ?? 0),
      current_number: String(row.current_number ?? ''),
      current_serving_number: String(row.current_serving_number ?? ''),
      average_service_time: Number(row.average_service_time ?? 0),
      service_id: typeof row.service_id === 'string' ? row.service_id : null,
      department_id: String(row.department_id ?? ''),
      serviceName: service?.name ?? 'Queue',
      departmentName: dept?.name ?? '',
    };
  });
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function resolveTargetQueue(
  ctx: ToolContext,
  args: Record<string, unknown>,
  options?: { preferWaiting?: boolean },
): Promise<{ ok: true; queue: QueueLite } | { ok: false; result: Record<string, unknown> }> {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned;

  const queues = await listOwnedQueues(ctx);
  if (queues.length === 0) return { ok: false, result: fail(ctx, 'no_queue') };

  const requestedId = isUuid(args.queueId) ? args.queueId.trim() : '';
  if (requestedId) {
    const match = queues.find((q) => q.id === requestedId);
    if (!match) return { ok: false, result: fail(ctx, 'queue_not_found') };
    return { ok: true, queue: match };
  }

  if (queues.length === 1) return { ok: true, queue: queues[0] };

  if (options?.preferWaiting) {
    const waiting = queues.filter((q) => q.total_waiting > 0);
    if (waiting.length === 1) return { ok: true, queue: waiting[0] };
  }

  return {
    ok: false,
    result: {
      error: 'multiple_queues',
      executed: false,
      needsConfirmation: false,
      message: ownerMessage(ctx.replyStyle, 'multiple_queues'),
      queues: queues.map((q) => ({
        queueId: q.id,
        serviceName: q.serviceName,
        departmentName: q.departmentName,
        status: mapQueueStatus(q.status),
        waitingCount: q.total_waiting,
      })),
    },
  };
}

type EntryLite = {
  id: string;
  ticket_number: string;
  status: string;
  position: number;
  service_id: string;
  queue_id: string;
  serviceName: string;
};

async function loadEntries(
  ctx: ToolContext,
  queueId: string,
  statuses: string[],
): Promise<EntryLite[]> {
  const { data, error } = await ctx.supabase
    .from('queue_entries')
    .select('id, ticket_number, status, position, service_id, queue_id, services(name)')
    .eq('queue_id', queueId)
    .in('status', statuses)
    .order('joined_at', { ascending: true })
    .limit(40);
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => {
    const service = unwrap(row.services as { name?: string } | { name?: string }[] | null);
    return {
      id: String(row.id),
      ticket_number: String(row.ticket_number ?? ''),
      status: String(row.status ?? ''),
      position: Number(row.position ?? 0),
      service_id: String(row.service_id ?? ''),
      queue_id: String(row.queue_id ?? ''),
      serviceName: service?.name ?? '',
    };
  });
}

function currentCustomer(entries: EntryLite[]): EntryLite | null {
  return (
    entries.find((e) => e.status === 'serving') ??
    entries.find((e) => e.status === 'called') ??
    null
  );
}

function toWaitingCard(entry: EntryLite): WaitingCustomerCard {
  return {
    entryId: entry.id,
    ticketNumber: entry.ticket_number,
    serviceName: entry.serviceName,
    status: entry.status,
    position: entry.position,
  };
}

function actionLabels(
  style: ReplyStyle,
  type: PendingAction['type'],
): PendingAction['labels'] {
  if (type === 'skip_customer') {
    if (style === 'urdu_script') {
      return { confirm: 'ہاں، گاہک کو چھوڑیں', dismiss: 'واپس' };
    }
    if (style === 'roman_urdu') {
      return { confirm: 'Haan, skip karein', dismiss: 'Cancel' };
    }
    return { confirm: 'Yes, skip customer', dismiss: 'Keep customer' };
  }
  if (style === 'urdu_script') {
    return { confirm: 'ہاں، قطار بند کریں', dismiss: 'واپس' };
  }
  if (style === 'roman_urdu') {
    return { confirm: 'Haan, queue close karein', dismiss: 'Cancel' };
  }
  return { confirm: 'Yes, close queue', dismiss: 'Keep queue open' };
}

export async function executeCallNext(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved = await resolveTargetQueue(ctx, args, { preferWaiting: true });
  if (!resolved.ok) return resolved.result;
  const queue = resolved.queue;
  const mapped = mapQueueStatus(queue.status);
  if (mapped === 'paused') return fail(ctx, 'queue_paused');
  if (mapped === 'closed') return fail(ctx, 'queue_closed');

  const { data, error } = await ctx.supabase.rpc('call_next_customer', {
    p_queue_id: queue.id,
  });
  if (error) return fail(ctx, mapRpcError(error));

  const payload = (data ?? {}) as Record<string, unknown>;
  const ticketNumber = String(payload.ticketNumber ?? '');
  ctx.ui.actionResult = { ok: true, code: 'called' };
  const message = successCall(ctx.replyStyle, ticketNumber, queue.serviceName);
  return {
    executed: true,
    ok: true,
    ticketNumber,
    entryId: payload.entryId ?? null,
    status: 'called',
    message,
  };
}

function successCall(style: ReplyStyle, ticketNumber: string, serviceName: string): string {
  const label = ticketNumber ? `#${ticketNumber}` : 'the next customer';
  if (style === 'urdu_script') {
    return `ہو گیا۔ ${serviceName} کی قطار میں گاہک ${label} کو بلا لیا گیا ہے۔`;
  }
  if (style === 'roman_urdu') {
    return `Done. ${serviceName} queue mein customer ${label} ko bula liya gaya hai.`;
  }
  return `Done. Called ${label} in the ${serviceName} queue.`;
}

export async function executePauseQueue(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return setOwnedQueueStatus(ctx, args, 'paused');
}

export async function executeResumeQueue(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return setOwnedQueueStatus(ctx, args, 'open');
}

async function setOwnedQueueStatus(
  ctx: ToolContext,
  args: Record<string, unknown>,
  status: 'open' | 'paused' | 'closed',
): Promise<Record<string, unknown>> {
  const resolved = await resolveTargetQueue(ctx, args);
  if (!resolved.ok) return resolved.result;
  const queue = resolved.queue;
  const current = mapQueueStatus(queue.status);
  if (status === 'paused' && current === 'paused') return fail(ctx, 'already_paused');
  if (status === 'open' && current === 'open') return fail(ctx, 'already_open');
  if (status === 'closed' && current === 'closed') return fail(ctx, 'already_closed');

  const owned = await loadOwnedQueue(ctx, queue.id);
  if (!owned) return fail(ctx, 'queue_not_found');

  const { data, error } = await ctx.supabase.rpc('set_queue_status', {
    p_queue_id: queue.id,
    p_status: status,
  });
  if (error) return fail(ctx, mapRpcError(error));
  const payload = (data ?? {}) as Record<string, unknown>;
  const nextStatus = String(payload.status ?? status);
  ctx.ui.actionResult = { ok: true, code: status };
  return {
    executed: true,
    ok: true,
    queueId: queue.id,
    status: nextStatus,
    message: statusMessage(ctx.replyStyle, status, queue.serviceName),
  };
}

function statusMessage(
  style: ReplyStyle,
  status: 'open' | 'paused' | 'closed',
  serviceName: string,
): string {
  if (style === 'urdu_script') {
    if (status === 'paused') return `${serviceName} کی قطار روک دی گئی ہے۔`;
    if (status === 'closed') return `${serviceName} کی قطار بند کر دی گئی ہے۔`;
    return `${serviceName} کی قطار دوبارہ کھول دی گئی ہے۔`;
  }
  if (style === 'roman_urdu') {
    if (status === 'paused') return `${serviceName} ki queue pause kar di gayi hai.`;
    if (status === 'closed') return `${serviceName} ki queue band kar di gayi hai.`;
    return `${serviceName} ki queue dobara open kar di gayi hai.`;
  }
  if (status === 'paused') return `Paused the ${serviceName} queue.`;
  if (status === 'closed') return `Closed the ${serviceName} queue.`;
  return `Resumed the ${serviceName} queue.`;
}

export async function executeServeCurrent(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved = await resolveTargetQueue(ctx, args);
  if (!resolved.ok) return resolved.result;
  const entries = await loadEntries(ctx, resolved.queue.id, ['serving', 'called']);
  const current = currentCustomer(entries);
  if (!current) return fail(ctx, 'no_current_customer');

  const { data, error } = await ctx.supabase.rpc('serve_customer', {
    p_entry_id: current.id,
  });
  if (error) return fail(ctx, mapRpcError(error));
  const payload = (data ?? {}) as Record<string, unknown>;
  ctx.ui.actionResult = { ok: true, code: 'served' };
  const ticketNumber = String(payload.ticketNumber ?? current.ticket_number);
  return {
    executed: true,
    ok: true,
    ticketNumber,
    status: 'served',
    message: serveMessage(ctx.replyStyle, ticketNumber),
  };
}

function serveMessage(style: ReplyStyle, ticketNumber: string): string {
  if (style === 'urdu_script') return `ہو گیا۔ گاہک #${ticketNumber} کو سرویڈ نشان زد کر دیا گیا ہے۔`;
  if (style === 'roman_urdu') {
    return `Done. Customer #${ticketNumber} ko served mark kar diya gaya hai.`;
  }
  return `Done. Marked customer #${ticketNumber} as served.`;
}

export async function prepareSkipCurrent(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved = await resolveTargetQueue(ctx, args);
  if (!resolved.ok) return resolved.result;
  const entries = await loadEntries(ctx, resolved.queue.id, ['serving', 'called']);
  const current = currentCustomer(entries);
  if (!current) return fail(ctx, 'no_current_customer');

  const pending = toPendingSkip(ctx, resolved.queue, current);
  ctx.ui.pendingAction = pending;
  ctx.ui.actionResult = undefined;
  const suggestedReply = skipConfirmSuggestion(ctx.replyStyle, current.ticket_number);
  return {
    needsConfirmation: true,
    executed: false,
    doNotSkipYet: true,
    instruction:
      'Do not claim the customer was skipped. Ask the owner to tap the confirm button.',
    ticketNumber: current.ticket_number,
    entryId: current.id,
    suggestedReply,
    message: suggestedReply,
  };
}

function toPendingSkip(ctx: ToolContext, queue: QueueLite, entry: EntryLite): PendingAction {
  return {
    type: 'skip_customer',
    organizationId: ctx.org?.id ?? '',
    organizationName: ctx.org?.name ?? '',
    serviceId: queue.service_id,
    serviceName: queue.serviceName,
    ticketId: null,
    ticketNumber: entry.ticket_number,
    entryId: entry.id,
    queueId: queue.id,
    waitingCount: queue.total_waiting,
    estimatedWaitMinutes: null,
    queueStatus: mapQueueStatus(queue.status),
    labels: actionLabels(ctx.replyStyle, 'skip_customer'),
  };
}

function skipConfirmSuggestion(style: ReplyStyle, ticketNumber: string): string {
  if (style === 'urdu_script') {
    return `موجودہ گاہک #${ticketNumber} کو چھوڑ دیا جائے گا۔ کیا آپ جاری رکھنا چاہتے ہیں؟`;
  }
  if (style === 'roman_urdu') {
    return `Current customer #${ticketNumber} skip ho jayega. Kya aap continue karna chahte hain?`;
  }
  return `The current customer #${ticketNumber} will be marked as skipped. Do you want me to continue?`;
}

export async function executeSkipCustomer(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const entryId = isUuid(args.entryId) ? args.entryId.trim() : '';
  if (!entryId) return fail(ctx, 'invalid_ids');

  const { data: entry, error: lookupError } = await ctx.supabase
    .from('queue_entries')
    .select('id, ticket_number, queue_id, status, queues!inner(organization_id)')
    .eq('id', entryId)
    .maybeSingle();
  if (lookupError) return fail(ctx, 'unknown');
  if (!entry) return fail(ctx, 'no_current_customer');

  const queueWrap = unwrap(
    (entry as { queues?: { organization_id: string } | { organization_id: string }[] }).queues,
  );
  if (!queueWrap || queueWrap.organization_id !== owned.org.id) {
    return fail(ctx, 'queue_not_found');
  }

  const { data, error } = await ctx.supabase.rpc('skip_customer', {
    p_entry_id: entryId,
  });
  if (error) return fail(ctx, mapRpcError(error));
  const payload = (data ?? {}) as Record<string, unknown>;
  ctx.ui.pendingAction = null;
  ctx.ui.actionResult = { ok: true, code: 'skipped' };
  const ticketNumber = String(payload.ticketNumber ?? entry.ticket_number);
  return {
    executed: true,
    ok: true,
    skipped: true,
    ticketNumber,
    next: payload.next ?? null,
    message: skipSuccess(ctx.replyStyle, ticketNumber),
  };
}

function skipSuccess(style: ReplyStyle, ticketNumber: string): string {
  if (style === 'urdu_script') return `ہو گیا۔ گاہک #${ticketNumber} کو چھوڑ دیا گیا ہے۔`;
  if (style === 'roman_urdu') return `Done. Customer #${ticketNumber} skip ho gaya hai.`;
  return `Done. Skipped customer #${ticketNumber}.`;
}

export async function prepareCloseQueue(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved = await resolveTargetQueue(ctx, args);
  if (!resolved.ok) return resolved.result;
  const queue = resolved.queue;
  if (mapQueueStatus(queue.status) === 'closed') return fail(ctx, 'already_closed');

  const pending: PendingAction = {
    type: 'close_queue',
    organizationId: ctx.org?.id ?? '',
    organizationName: ctx.org?.name ?? '',
    serviceId: queue.service_id,
    serviceName: queue.serviceName,
    ticketId: null,
    ticketNumber: null,
    entryId: null,
    queueId: queue.id,
    waitingCount: queue.total_waiting,
    estimatedWaitMinutes: null,
    queueStatus: mapQueueStatus(queue.status),
    labels: actionLabels(ctx.replyStyle, 'close_queue'),
  };
  ctx.ui.pendingAction = pending;
  ctx.ui.actionResult = undefined;
  const suggestedReply = closeConfirmSuggestion(ctx.replyStyle, queue.serviceName);
  return {
    needsConfirmation: true,
    executed: false,
    doNotCloseYet: true,
    instruction: 'Do not claim the queue was closed. Ask the owner to tap confirm.',
    suggestedReply,
    message: suggestedReply,
  };
}

function closeConfirmSuggestion(style: ReplyStyle, serviceName: string): string {
  if (style === 'urdu_script') {
    return `${serviceName} کی قطار مستقل طور پر بند ہو جائے گی۔ کیا آپ جاری رکھنا چاہتے ہیں؟`;
  }
  if (style === 'roman_urdu') {
    return `${serviceName} ki queue permanently close ho jayegi. Kya aap continue karna chahte hain?`;
  }
  return `The ${serviceName} queue will be closed. Do you want me to continue?`;
}

export async function executeCloseQueue(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await setOwnedQueueStatus(ctx, args, 'closed');
  if (result.ok === true) {
    ctx.ui.pendingAction = null;
  }
  return result;
}

export function parseConfirmedAction(raw: unknown): ConfirmedAction | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  if (row.name === 'skipCustomer') {
    if (!isUuid(row.entryId)) return null;
    return { name: 'skipCustomer', entryId: row.entryId.trim() };
  }
  if (row.name === 'closeQueue') {
    if (!isUuid(row.queueId)) return null;
    return { name: 'closeQueue', queueId: row.queueId.trim() };
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
  return ownerMessage(fallbackStyle, 'unknown');
}

export { toWaitingCard, loadEntries, currentCustomer, listOwnedQueues as listQueues };
