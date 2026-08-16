import { getBusinessHelp } from './help.ts';
import { REPLY_IN_INSTRUCTION } from '../_shared/chatbot/reply-style.ts';
import {
  executeCallNext,
  executePauseQueue,
  executeResumeQueue,
  executeServeCurrent,
  listOwnedQueues,
  loadEntries,
  prepareCloseQueue,
  prepareSkipCurrent,
  currentCustomer,
  toWaitingCard,
} from './actions.ts';
import { mapQueueStatus, requireOrg } from './ownership.ts';
import type {
  HistoryCard,
  QueueStatusCard,
  ServiceInfoCard,
  StatsCard,
  ToolContext,
} from './types.ts';
import { HISTORY_TICKET_STATUSES, MAX_RESULTS } from './types.ts';

export const TOOL_DECLARATIONS = [
  {
    name: 'getBusinessProfile',
    description:
      'Return the authenticated owner\'s business: name, description, category, address, city, departments, services, subscription and approval status. Never invent values. Never use another organization.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getQueueStatus',
    description:
      'Queue status for the owner\'s business: open/paused/closed, waiting count, currently serving, next customer. If multiple queues exist, returns all of them.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING', description: 'Optional queue UUID from a previous tool result' },
      },
    },
  },
  {
    name: 'getWaitingCustomers',
    description:
      'List customers currently waiting in the owner\'s queue. Returns ticket numbers only — never phone, email, or profile details.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'getCurrentServingCustomer',
    description: 'Return the customer currently being served or called in the owner\'s queue.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'callNextCustomer',
    description:
      'Call the next waiting customer using the existing queue RPC. Executes immediately. If the RPC fails, say so — never claim success. If several queues have waiting customers, ask which.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'pauseQueue',
    description:
      'Temporarily pause the owner\'s queue (customers cannot join). Low-risk; executes immediately. If the owner said "band" and might mean close, ask first instead of guessing.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'resumeQueue',
    description: 'Resume a paused queue. Executes immediately via set_queue_status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'serveCurrentCustomer',
    description:
      'Mark the current called/serving customer as served using serve_customer. Executes immediately. If none, say so.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'skipCurrentCustomer',
    description:
      'PREPARE skipping the current customer. Does NOT skip yet. After needsConfirmation=true, tell the owner to tap the confirm button. Never claim skip succeeded.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'closeQueue',
    description:
      'PREPARE permanently closing the owner\'s queue. Does NOT close yet. Use only when the owner clearly wants close, not pause. After needsConfirmation, tell them to tap confirm.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queueId: { type: 'STRING' },
      },
    },
  },
  {
    name: 'getBusinessTickets',
    description:
      'List the owner\'s tickets with optional period and status filters. Always scoped to the owner organization.',
    parameters: {
      type: 'OBJECT',
      properties: {
        period: {
          type: 'STRING',
          description: 'today, yesterday, this_week, this_month, or all',
        },
        status: {
          type: 'STRING',
          description: 'served, skipped, cancelled, waiting, serving, called, or all',
        },
        limit: { type: 'NUMBER' },
      },
    },
  },
  {
    name: 'getBusinessHistory',
    description:
      'Database-backed history of served, skipped, and cancelled tickets for the owner\'s business. Use for "today\'s activity" and "how many served".',
    parameters: {
      type: 'OBJECT',
      properties: {
        period: {
          type: 'STRING',
          description: 'today, yesterday, this_week, this_month, or all',
        },
        limit: { type: 'NUMBER' },
      },
    },
  },
  {
    name: 'getDepartments',
    description: 'List the owner\'s actual departments. Never invent names.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getBusinessServices',
    description:
      'List the owner\'s actual services with department, name, price, and active status. Never invent a service or price. Use for "how much is my haircut".',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Optional service name filter, e.g. haircut' },
      },
    },
  },
  {
    name: 'getBusinessStatistics',
    description:
      'Real counts: customers today, served today, waiting now, skipped today, cancelled today, department and service activity. Never invent statistics. If data is missing, say so.',
    parameters: {
      type: 'OBJECT',
      properties: {
        period: {
          type: 'STRING',
          description: 'today, yesterday, this_week, this_month. Default today.',
        },
      },
    },
  },
  {
    name: 'getBusinessAccountStatus',
    description:
      'Safe account status: subscription, approval, whether visible to customers, operational status. Never return bank/EasyPaisa numbers, payment screenshots, or admin internals.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getBusinessHelp',
    description:
      'Explain how MeriBaari actually works for business owners: queues, departments, services, notifications, profile, location, subscription, customers, history, pause/resume, calling.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: {
          type: 'STRING',
          description:
            'queues, departments, services, notifications, profile, location, subscription, customers, history, pause_resume, calling, or overview',
        },
      },
    },
  },
];

export async function executeTool(
  name: string,
  rawArgs: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  let result: unknown;
  switch (name) {
    case 'getBusinessProfile':
      result = await getBusinessProfile(ctx);
      break;
    case 'getQueueStatus':
      result = await getQueueStatus(ctx, rawArgs);
      break;
    case 'getWaitingCustomers':
      result = await getWaitingCustomers(ctx, rawArgs);
      break;
    case 'getCurrentServingCustomer':
      result = await getCurrentServingCustomer(ctx, rawArgs);
      break;
    case 'callNextCustomer':
      result = await executeCallNext(ctx, rawArgs);
      break;
    case 'pauseQueue':
      result = await executePauseQueue(ctx, rawArgs);
      break;
    case 'resumeQueue':
      result = await executeResumeQueue(ctx, rawArgs);
      break;
    case 'serveCurrentCustomer':
      result = await executeServeCurrent(ctx, rawArgs);
      break;
    case 'skipCurrentCustomer':
      result = await prepareSkipCurrent(ctx, rawArgs);
      break;
    case 'closeQueue':
      result = await prepareCloseQueue(ctx, rawArgs);
      break;
    case 'getBusinessTickets':
      result = await getBusinessTickets(ctx, rawArgs);
      break;
    case 'getBusinessHistory':
      result = await getBusinessHistory(ctx, rawArgs);
      break;
    case 'getDepartments':
      result = await getDepartments(ctx);
      break;
    case 'getBusinessServices':
      result = await getBusinessServices(ctx, rawArgs);
      break;
    case 'getBusinessStatistics':
      result = await getBusinessStatistics(ctx, rawArgs);
      break;
    case 'getBusinessAccountStatus':
      result = await getBusinessAccountStatus(ctx);
      break;
    case 'getBusinessHelp':
      result = getBusinessHelp(
        typeof rawArgs.topic === 'string' ? rawArgs.topic : undefined,
        ctx.replyStyle,
      );
      break;
    default:
      result = { error: 'unknown_tool' };
  }
  return annotateToolResult(result, ctx);
}

function annotateToolResult(result: unknown, ctx: ToolContext): Record<string, unknown> {
  const extra = {
    replyStyle: ctx.replyStyle,
    replyIn: REPLY_IN_INSTRUCTION[ctx.replyStyle],
  };
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return { ...extra, ...(result as Record<string, unknown>) };
  }
  return { ...extra, result };
}

async function getBusinessProfile(ctx: ToolContext) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const org = owned.org;

  const { data: departments } = await ctx.supabase
    .from('departments')
    .select('id, name, is_active, status')
    .eq('organization_id', org.id)
    .order('display_order', { ascending: true });

  const deptRows = (departments ?? []) as Array<{
    id: string;
    name: string;
    is_active: boolean;
    status: string;
  }>;
  const deptIds = deptRows.map((d) => d.id);
  let services: ServiceInfoCard[] = [];
  if (deptIds.length > 0) {
    const { data: serviceRows } = await ctx.supabase
      .from('services')
      .select('id, name, price, is_active, status, department_id')
      .in('department_id', deptIds)
      .order('display_order', { ascending: true });
    const deptName = new Map(deptRows.map((d) => [d.id, d.name]));
    services = ((serviceRows ?? []) as Array<{
      id: string;
      name: string;
      price: number | null;
      is_active: boolean;
      status: string;
      department_id: string;
    }>).map((s) => ({
      id: s.id,
      name: s.name,
      departmentName: deptName.get(s.department_id) ?? '',
      price: typeof s.price === 'number' ? s.price : null,
      isActive: s.is_active === true && s.status === 'active',
    }));
  }

  ctx.ui.services = services.slice(0, MAX_RESULTS);

  return {
    business: {
      name: org.name,
      description: org.description,
      category: org.category,
      address: org.address,
      city: org.city,
      hasCoordinates: org.latitude != null && org.longitude != null,
      workingHours: org.workingHours,
      phone: org.phone,
      departments: deptRows.map((d) => ({
        name: d.name,
        isActive: d.is_active === true && d.status === 'active',
      })),
      services,
      subscriptionStatus: org.subscriptionStatus,
      approvalStatus: approvalLabel(org.subscriptionStatus, org.approvedAt),
      operationalStatus: org.isActive && org.status === 'active' ? 'operational' : org.status,
      visibleToCustomers: isVisible(org),
      adminHidden: org.adminHidden === true,
    },
  };
}

function isVisible(org: {
  subscriptionStatus: string;
  isActive: boolean;
  status: string;
  adminHidden?: boolean;
}): boolean {
  return (
    org.subscriptionStatus === 'active' &&
    org.isActive &&
    org.status === 'active' &&
    org.adminHidden !== true
  );
}

function approvalLabel(subscriptionStatus: string, approvedAt: string | null): string {
  if (subscriptionStatus === 'active' || approvedAt) return 'approved';
  if (subscriptionStatus === 'pending_approval') return 'pending_approval';
  if (subscriptionStatus === 'rejected') return 'rejected';
  if (subscriptionStatus === 'pending_payment') return 'pending_payment';
  return 'not_submitted';
}

async function getQueueStatus(ctx: ToolContext, args: Record<string, unknown>) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const queues = await listOwnedQueues(ctx);
  if (queues.length === 0) {
    ctx.ui.queueStatus = [];
    return { count: 0, queues: [], message: 'no_queue' };
  }

  const requested = typeof args.queueId === 'string' ? args.queueId.trim() : '';
  const selected = requested ? queues.filter((q) => q.id === requested) : queues;
  if (requested && selected.length === 0) {
    return { error: 'queue_not_found', queues: [] };
  }

  const cards: QueueStatusCard[] = [];
  for (const queue of selected) {
    const entries = await loadEntries(ctx, queue.id, ['waiting', 'called', 'serving']);
    const serving = currentCustomer(entries);
    const nextWaiting = entries.find((e) => e.status === 'waiting');
    const waitingCount = entries.filter((e) => e.status === 'waiting').length;
    cards.push({
      queueId: queue.id,
      queueName: queue.serviceName,
      departmentName: queue.departmentName,
      serviceName: queue.serviceName,
      status: mapQueueStatus(queue.status),
      waitingCount,
      currentlyServing: serving ? `#${serving.ticket_number}` : null,
      nextCustomer: nextWaiting ? `#${nextWaiting.ticket_number}` : null,
      estimatedWaitMinutes:
        waitingCount > 0 && queue.average_service_time > 0
          ? waitingCount * queue.average_service_time
          : null,
    });
  }

  ctx.ui.queueStatus = cards;
  return { count: cards.length, queues: cards };
}

async function getWaitingCustomers(ctx: ToolContext, args: Record<string, unknown>) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const queues = await listOwnedQueues(ctx);
  const requested = typeof args.queueId === 'string' ? args.queueId.trim() : '';
  const selected = requested ? queues.filter((q) => q.id === requested) : queues;
  if (requested && selected.length === 0) return { error: 'queue_not_found', customers: [] };

  const customers = [];
  for (const queue of selected) {
    const entries = await loadEntries(ctx, queue.id, ['waiting']);
    for (const entry of entries) {
      customers.push({
        ...toWaitingCard(entry),
        serviceName: entry.serviceName || queue.serviceName,
      });
    }
  }
  ctx.ui.waiting = customers.slice(0, MAX_RESULTS);
  return { count: customers.length, customers: ctx.ui.waiting };
}

async function getCurrentServingCustomer(ctx: ToolContext, args: Record<string, unknown>) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const queues = await listOwnedQueues(ctx);
  const requested = typeof args.queueId === 'string' ? args.queueId.trim() : '';
  const selected = requested ? queues.filter((q) => q.id === requested) : queues;
  if (selected.length === 0) return { serving: null };

  for (const queue of selected) {
    const entries = await loadEntries(ctx, queue.id, ['serving', 'called']);
    const current = currentCustomer(entries);
    if (current) {
      const card = toWaitingCard(current);
      ctx.ui.waiting = [card];
      return { serving: card, queueId: queue.id, serviceName: queue.serviceName };
    }
  }
  ctx.ui.waiting = [];
  return { serving: null };
}

type Period = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all';

function parsePeriod(raw: unknown, fallback: Period = 'all'): Period {
  if (typeof raw !== 'string') return fallback;
  const v = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (v === 'today' || v === 'yesterday' || v === 'this_week' || v === 'this_month' || v === 'all') {
    return v;
  }
  if (v.includes('today') || v === 'aaj') return 'today';
  if (v.includes('yesterday') || v === 'kal') return 'yesterday';
  if (v.includes('week') || v.includes('haft')) return 'this_week';
  if (v.includes('month')) return 'this_month';
  return fallback;
}

/** Pakistan is UTC+5 with no DST. */
function periodRange(period: Period): { from: string | null; to: string | null } {
  if (period === 'all') return { from: null, to: null };
  const PKT = 5 * 60 * 60 * 1000;
  const now = Date.now();
  const pkt = new Date(now + PKT);
  const y = pkt.getUTCFullYear();
  const m = pkt.getUTCMonth();
  const d = pkt.getUTCDate();
  const startOfTodayUtc = Date.UTC(y, m, d) - PKT;

  if (period === 'today') {
    return { from: new Date(startOfTodayUtc).toISOString(), to: new Date(now).toISOString() };
  }
  if (period === 'yesterday') {
    return {
      from: new Date(startOfTodayUtc - 86400000).toISOString(),
      to: new Date(startOfTodayUtc).toISOString(),
    };
  }
  if (period === 'this_week') {
    const weekday = pkt.getUTCDay() || 7;
    const weekStart = startOfTodayUtc - (weekday - 1) * 86400000;
    return { from: new Date(weekStart).toISOString(), to: new Date(now).toISOString() };
  }
  const monthStart = Date.UTC(y, m, 1) - PKT;
  return { from: new Date(monthStart).toISOString(), to: new Date(now).toISOString() };
}

function parseStatusFilter(raw: unknown): string[] | null {
  if (typeof raw !== 'string' || !raw.trim() || raw.trim().toLowerCase() === 'all') {
    return null;
  }
  const v = raw.trim().toLowerCase();
  if (v === 'served' || v === 'completed') return ['served'];
  if (v === 'skipped' || v === 'missed') return ['skipped'];
  if (v === 'cancelled') return ['cancelled'];
  if (v === 'waiting') return ['waiting'];
  if (v === 'serving') return ['serving'];
  if (v === 'called') return ['called'];
  return null;
}

async function queryOwnerTickets(
  ctx: ToolContext,
  options: { period: Period; statuses: string[] | null; limit: number; timeField: 'created_at' | 'updated_at' },
): Promise<HistoryCard[]> {
  if (!ctx.org) return [];
  const range = periodRange(options.period);
  let builder = ctx.supabase
    .from('tickets')
    .select(
      'id, ticket_number, status, created_at, updated_at, department_id, service_id, services(name), departments(name)',
    )
    .eq('organization_id', ctx.org.id)
    .order(options.timeField, { ascending: false })
    .limit(options.limit);

  if (options.statuses) {
    builder = builder.in('status', options.statuses);
  }
  if (range.from) builder = builder.gte(options.timeField, range.from);
  if (range.to) builder = builder.lt(options.timeField, range.to);

  const { data, error } = await builder;
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => {
    const service = unwrapName(row.services);
    const dept = unwrapName(row.departments);
    const visitedAt = String(
      options.timeField === 'created_at' ? row.created_at ?? '' : row.updated_at ?? '',
    );
    return {
      id: String(row.id),
      ticketNumber: String(row.ticket_number ?? ''),
      serviceName: service,
      departmentName: dept,
      status: String(row.status ?? ''),
      visitedAt,
    };
  });
}

function unwrapName(value: unknown): string {
  if (!value) return '';
  if (Array.isArray(value)) {
    const first = value[0] as { name?: string } | undefined;
    return first?.name ?? '';
  }
  if (typeof value === 'object' && value && 'name' in value) {
    return String((value as { name?: string }).name ?? '');
  }
  return '';
}

async function getBusinessTickets(ctx: ToolContext, args: Record<string, unknown>) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const period = parsePeriod(args.period, 'all');
  const statuses = parseStatusFilter(args.status);
  const limit = Math.min(
    20,
    Math.max(1, typeof args.limit === 'number' ? Math.floor(args.limit) : 10),
  );
  const tickets = await queryOwnerTickets(ctx, {
    period,
    statuses,
    limit,
    timeField:
      statuses && statuses.every((s) =>
        (HISTORY_TICKET_STATUSES as readonly string[]).includes(s),
      )
      ? 'updated_at'
      : 'created_at',
  });
  ctx.ui.history = tickets;
  return { count: tickets.length, period, tickets };
}

async function getBusinessHistory(ctx: ToolContext, args: Record<string, unknown>) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const period = parsePeriod(args.period, 'today');
  const limit = Math.min(
    20,
    Math.max(1, typeof args.limit === 'number' ? Math.floor(args.limit) : 12),
  );
  const tickets = await queryOwnerTickets(ctx, {
    period,
    statuses: [...HISTORY_TICKET_STATUSES],
    limit,
    timeField: 'updated_at',
  });
  ctx.ui.history = tickets;
  const served = tickets.filter((t) => t.status === 'served').length;
  const skipped = tickets.filter((t) => t.status === 'skipped').length;
  const cancelled = tickets.filter((t) => t.status === 'cancelled').length;
  return {
    count: tickets.length,
    period,
    served,
    skipped,
    cancelled,
    tickets,
  };
}

async function getDepartments(ctx: ToolContext) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const { data, error } = await ctx.supabase
    .from('departments')
    .select('id, name, is_active, status, estimated_service_time')
    .eq('organization_id', owned.org.id)
    .order('display_order', { ascending: true });
  if (error) return { error: 'lookup_failed', departments: [] };
  const departments = (data ?? []).map(
    (row: { id: string; name: string; is_active: boolean; status: string; estimated_service_time: number }) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active === true && row.status === 'active',
      estimatedServiceMinutes: row.estimated_service_time,
    }),
  );
  return { count: departments.length, departments };
}

async function getBusinessServices(ctx: ToolContext, args: Record<string, unknown>) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const query = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';

  const { data: departments } = await ctx.supabase
    .from('departments')
    .select('id, name')
    .eq('organization_id', owned.org.id);
  const deptRows = (departments ?? []) as Array<{ id: string; name: string }>;
  const deptIds = deptRows.map((d) => d.id);
  if (deptIds.length === 0) {
    ctx.ui.services = [];
    return { count: 0, services: [] };
  }

  const { data, error } = await ctx.supabase
    .from('services')
    .select('id, name, price, is_active, status, department_id')
    .in('department_id', deptIds)
    .order('display_order', { ascending: true });
  if (error) return { error: 'lookup_failed', services: [] };

  const deptName = new Map(deptRows.map((d) => [d.id, d.name]));
  let services: ServiceInfoCard[] = ((data ?? []) as Array<{
    id: string;
    name: string;
    price: number | null;
    is_active: boolean;
    status: string;
    department_id: string;
  }>).map((s) => ({
    id: s.id,
    name: s.name,
    departmentName: deptName.get(s.department_id) ?? '',
    price: typeof s.price === 'number' ? s.price : null,
    isActive: s.is_active === true && s.status === 'active',
  }));

  if (query) {
    services = services.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.departmentName.toLowerCase().includes(query),
    );
  }

  ctx.ui.services = services.slice(0, MAX_RESULTS);
  return { count: services.length, services: ctx.ui.services };
}

async function getBusinessStatistics(ctx: ToolContext, args: Record<string, unknown>) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const period = parsePeriod(args.period, 'today');
  const range = periodRange(period);

  let createdQuery = ctx.supabase
    .from('tickets')
    .select('id, status, service_id, department_id, created_at, updated_at, services(name), departments(name)')
    .eq('organization_id', owned.org.id)
    .limit(500);
  if (range.from) createdQuery = createdQuery.gte('created_at', range.from);
  if (range.to) createdQuery = createdQuery.lt('created_at', range.to);

  const { data: joinedRows, error: joinedError } = await createdQuery;
  if (joinedError) return { error: 'lookup_failed' };

  let updatedQuery = ctx.supabase
    .from('tickets')
    .select('id, status, updated_at')
    .eq('organization_id', owned.org.id)
    .in('status', ['served', 'skipped', 'cancelled'])
    .limit(500);
  if (range.from) updatedQuery = updatedQuery.gte('updated_at', range.from);
  if (range.to) updatedQuery = updatedQuery.lt('updated_at', range.to);
  const { data: finishedRows } = await updatedQuery;

  const queues = await listOwnedQueues(ctx);
  const waitingNow = queues.reduce((sum, q) => {
    const n = Number(q.total_waiting);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const activeQueues = queues.filter((q) => mapQueueStatus(q.status) === 'open').length;

  const joined = joinedRows ?? [];
  const finished = finishedRows ?? [];
  const served = finished.filter((t: { status: string }) => t.status === 'served').length;
  const skipped = finished.filter((t: { status: string }) => t.status === 'skipped').length;
  const cancelled = finished.filter((t: { status: string }) => t.status === 'cancelled').length;

  const deptCounts = new Map<string, number>();
  const serviceCounts = new Map<string, number>();
  for (const row of joined as Array<Record<string, unknown>>) {
    const dept = unwrapName(row.departments) || 'Unknown';
    const service = unwrapName(row.services) || 'Unknown';
    deptCounts.set(dept, (deptCounts.get(dept) ?? 0) + 1);
    serviceCounts.set(service, (serviceCounts.get(service) ?? 0) + 1);
  }

  const stats: StatsCard = {
    period,
    customers: joined.length,
    served,
    skipped,
    cancelled,
    waiting: waitingNow,
  };
  ctx.ui.stats = stats;

  const busiestService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const busiestDepartment = [...deptCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  return {
    period,
    customers: joined.length,
    served,
    skipped,
    cancelled,
    waitingNow,
    activeQueues,
    busiestService: busiestService
      ? { name: busiestService[0], customers: busiestService[1] }
      : null,
    busiestDepartment: busiestDepartment
      ? { name: busiestDepartment[0], customers: busiestDepartment[1] }
      : null,
    departmentActivity: [...deptCounts.entries()].map(([name, customers]) => ({
      name,
      customers,
    })),
    serviceActivity: [...serviceCounts.entries()].map(([name, customers]) => ({
      name,
      customers,
    })),
    insufficientData: joined.length === 0 && finished.length === 0,
  };
}

async function getBusinessAccountStatus(ctx: ToolContext) {
  const owned = requireOrg(ctx);
  if (!owned.ok) return owned.result;
  const org = owned.org;
  const visible = isVisible(org);
  const approval = approvalLabel(org.subscriptionStatus, org.approvedAt);
  return {
    subscriptionStatus: org.subscriptionStatus,
    approvalStatus: approval,
    visibleToCustomers: visible,
    adminHidden: org.adminHidden === true,
    operationalStatus: org.isActive && org.status === 'active' ? 'operational' : org.status,
    organizationStatus: org.status,
    isActive: org.isActive,
    rejectionReason:
      org.subscriptionStatus === 'rejected' ? org.paymentRejectionReason : null,
    note:
      'Payment account numbers, EasyPaisa details, and payment screenshots are not available through this assistant.',
  };
}
