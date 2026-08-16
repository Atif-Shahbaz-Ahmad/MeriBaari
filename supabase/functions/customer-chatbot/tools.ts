import { getAppHelp } from './help.ts';
import { hasValidCoords, haversineKm, roundKm } from './geo.ts';
import { LOCATION_UNAVAILABLE_MESSAGE, REPLY_IN_INSTRUCTION } from './reply-style.ts';
import { mapTicketPayload, prepareCancelTicket, prepareJoinQueue } from './actions.ts';
import type {
  BusinessCard,
  FavoriteCard,
  HistoryCard,
  TicketCard,
  ToolContext,
} from './types.ts';
import {
  ACTIVE_TICKET_STATUSES,
  HISTORY_TICKET_STATUSES,
  MAX_RESULTS,
} from './types.ts';

const CATEGORIES = [
  'barber_shop',
  'clinic',
  'workshop',
  'salon',
  'restaurant',
  'pharmacy',
  'other',
] as const;

type OrgRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: string | null;
  average_wait_time: number | null;
  is_active: boolean;
  status: string;
  subscription_status: string;
  rating: number | null;
  review_count: number | null;
  phone: string | null;
};

type ServiceJoinRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  estimated_duration: number | null;
  is_active: boolean;
  status: string;
  departments:
    | {
        id: string;
        name: string;
        organization_id: string;
        organizations: OrgRow | OrgRow[] | null;
      }
    | {
        id: string;
        name: string;
        organization_id: string;
        organizations: OrgRow | OrgRow[] | null;
      }[]
    | null;
};

export const TOOL_DECLARATIONS = [
  {
    name: 'searchOrganizations',
    description:
      'Search public MeriBaari businesses by text, category, city, price, distance, or favorites. Use for haircut, dentist, plumber, mobile repair, car wash, and similar requests. Never invent results.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description:
            'Free-text service or business name, e.g. haircut, dentist, mobile repair',
        },
        category: {
          type: 'STRING',
          description:
            'One of: barber_shop, clinic, workshop, salon, restaurant, pharmacy, other, all',
        },
        city: {
          type: 'STRING',
          description: 'City or area name such as Lahore or Karachi',
        },
        maxPrice: {
          type: 'NUMBER',
          description: 'Maximum service price in PKR (e.g. 3000)',
        },
        nearby: {
          type: 'BOOLEAN',
          description: 'If true, prefer businesses near the customer location',
        },
        maxDistanceKm: {
          type: 'NUMBER',
          description: 'Maximum distance in km when location is available',
        },
        sort: {
          type: 'STRING',
          description: 'relevance, distance, price, or name',
        },
        favoritesOnly: {
          type: 'BOOLEAN',
          description: 'If true, only search the customer\'s favorite businesses',
        },
        openOnly: {
          type: 'BOOLEAN',
          description: 'If true (default), only currently active businesses',
        },
      },
    },
  },
  {
    name: 'searchServices',
    description:
      'Search public services by name and optional max price. Returns matching services with their business.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Service name, e.g. haircut, AC repair, dental checkup',
        },
        maxPrice: { type: 'NUMBER', description: 'Maximum price in PKR' },
        nearby: { type: 'BOOLEAN' },
        maxDistanceKm: { type: 'NUMBER' },
      },
    },
  },
  {
    name: 'getOrganizationDetails',
    description:
      'Get public details for one business: address, hours, services and prices. Use only a real organization id from a previous search.',
    parameters: {
      type: 'OBJECT',
      properties: {
        organizationId: { type: 'STRING', description: 'Organization UUID' },
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'getNearbyOrganizations',
    description:
      'List nearby public businesses using the customer\'s current location. Requires location. Do not invent coordinates.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Optional service or category text' },
        category: { type: 'STRING' },
        maxDistanceKm: { type: 'NUMBER' },
        maxPrice: { type: 'NUMBER' },
      },
    },
  },
  {
    name: 'getCustomerActiveTicket',
    description:
      'Get the authenticated customer\'s current queue ticket: position, people ahead, wait estimate, business name. Returns none if not in a queue.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getCustomerTickets',
    description:
      'List the authenticated customer\'s recent tickets (active and history). Does not include other customers.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'Max tickets, default 8, max 12' },
      },
    },
  },
  {
    name: 'getCustomerFavorites',
    description:
      'List businesses the authenticated customer has favorited.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Optional filter, e.g. barber or dentist',
        },
      },
    },
  },
  {
    name: 'getCustomerHistory',
    description:
      'List the authenticated customer\'s recent completed, cancelled, or skipped visits.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'Max items, default 8' },
      },
    },
  },
  {
    name: 'getQueueStatus',
    description:
      'Queue status for the customer\'s active ticket (same as getCustomerActiveTicket). Use for "when is my turn" and "how many people ahead".',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getAppHelp',
    description:
      'Explain how MeriBaari actually works: join queue, cancel ticket, notifications, language, favorites, nearby search.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: {
          type: 'STRING',
          description:
            'join_queue, cancel_ticket, notifications, language, favorites, nearby, tickets, or overview',
        },
      },
    },
  },
  {
    name: 'joinQueue',
    description:
      'Prepare joining a live queue (not a timed appointment). Does NOT create a ticket. Call only after you have a real organizationId and serviceId from tools. If the customer has not chosen a business or service, ask first. After this returns needsConfirmation=true, tell them to tap Confirm & Join Queue. Never claim they have joined. Never invent ticket numbers. "book", "reserve", "appointment", and "ticket" mean join queue.',
    parameters: {
      type: 'OBJECT',
      properties: {
        organizationId: {
          type: 'STRING',
          description: 'Organization UUID from a previous tool result',
        },
        serviceId: {
          type: 'STRING',
          description: 'Service UUID from a previous tool result',
        },
      },
    },
  },
  {
    name: 'cancelTicket',
    description:
      "Prepare cancelling the authenticated customer's own active ticket. Does NOT cancel yet. Omit ticketId to look up their active ticket. If none, say so. If multiple, ask which. After needsConfirmation=true, tell them to tap Yes, Cancel Ticket. Never cancel another customer's ticket. Never claim cancellation succeeded.",
    parameters: {
      type: 'OBJECT',
      properties: {
        ticketId: {
          type: 'STRING',
          description: "Ticket UUID from getCustomerActiveTicket or getCustomerTickets",
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
    case 'searchOrganizations':
      result = await searchOrganizations(ctx, rawArgs);
      break;
    case 'searchServices':
      result = await searchServices(ctx, rawArgs);
      break;
    case 'getOrganizationDetails':
      result = await getOrganizationDetails(ctx, rawArgs);
      break;
    case 'getNearbyOrganizations':
      result = await getNearbyOrganizations(ctx, rawArgs);
      break;
    case 'getCustomerActiveTicket':
    case 'getQueueStatus':
      result = await getCustomerActiveTicket(ctx);
      break;
    case 'getCustomerTickets':
      result = await getCustomerTickets(ctx, rawArgs);
      break;
    case 'getCustomerFavorites':
      result = await getCustomerFavorites(ctx, rawArgs);
      break;
    case 'getCustomerHistory':
      result = await getCustomerHistory(ctx, rawArgs);
      break;
    case 'getAppHelp':
      result = getAppHelp(
        typeof rawArgs.topic === 'string' ? rawArgs.topic : undefined,
        ctx.replyStyle,
      );
      break;
    case 'joinQueue':
      result = await prepareJoinQueue(ctx, rawArgs);
      break;
    case 'cancelTicket':
      result = await prepareCancelTicket(ctx, rawArgs);
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

function isPublicOrg(org: Partial<OrgRow> | null | undefined): boolean {
  return Boolean(
    org &&
      org.subscription_status === 'active' &&
      org.is_active === true &&
      org.status === 'active',
  );
}

function sanitizeIlike(value: string): string {
  return value.replace(/[%_,*()\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeCategory(value: unknown): string | 'all' {
  if (typeof value !== 'string' || !value.trim()) return 'all';
  const v = value.trim().toLowerCase();
  if (v === 'all') return 'all';
  if ((CATEGORIES as readonly string[]).includes(v)) return v;
  if (v.includes('barber') || v.includes('hair')) return 'barber_shop';
  if (v.includes('salon') || v.includes('beauty')) return 'salon';
  if (v.includes('clinic') || v.includes('dentist') || v.includes('doctor')) {
    return 'clinic';
  }
  if (
    v.includes('workshop') ||
    v.includes('repair') ||
    v.includes('mechanic') ||
    v.includes('car')
  ) {
    return 'workshop';
  }
  if (v.includes('restaurant') || v.includes('food')) return 'restaurant';
  if (v.includes('pharm') || v.includes('medicine')) return 'pharmacy';
  return 'all';
}

function distanceKm(
  org: { latitude?: number | null; longitude?: number | null },
  location: ToolContext['location'],
): number | null {
  if (!location || !hasValidCoords(org.latitude, org.longitude)) return null;
  return roundKm(
    haversineKm(location, {
      latitude: org.latitude,
      longitude: org.longitude,
    }),
  );
}

function toBusinessCard(
  org: OrgRow,
  extras: {
    distanceKm: number | null;
    serviceId?: string | null;
    serviceName?: string | null;
    price?: number | null;
  },
): BusinessCard {
  const reviewCount = Number(org.review_count ?? 0);
  const rating = Number(org.rating ?? 0);
  return {
    id: org.id,
    name: org.name,
    category: org.category ?? 'other',
    distanceKm: extras.distanceKm,
    serviceId: extras.serviceId ?? null,
    serviceName: extras.serviceName ?? null,
    price: extras.price ?? null,
    address: org.address ?? '',
    city: org.city ?? '',
    isOpen: isPublicOrg(org),
    workingHours: org.working_hours ?? null,
    averageWaitMinutes:
      typeof org.average_wait_time === 'number' ? org.average_wait_time : null,
    rating: reviewCount > 0 && rating > 0 ? rating : null,
    reviewCount,
  };
}

async function loadFavoriteOrgIds(ctx: ToolContext): Promise<Set<string>> {
  const { data, error } = await ctx.supabase
    .from('favorites')
    .select('organization_id')
    .eq('user_id', ctx.userId);
  if (error) return new Set();
  return new Set(
    (data ?? []).map((row: { organization_id: string }) => row.organization_id),
  );
}

async function loadMatchingServiceOrgs(
  ctx: ToolContext,
  query: string,
  maxPrice: number | null,
): Promise<Map<string, { serviceId: string; serviceName: string; price: number | null }>> {
  const matched = new Map<string, { serviceId: string; serviceName: string; price: number | null }>();
  if (!query && maxPrice == null) return matched;

  let builder = ctx.supabase
    .from('services')
    .select(
      'id, name, description, price, estimated_duration, is_active, status, departments!inner(id, name, organization_id, organizations!inner(id, name, category, address, city, latitude, longitude, working_hours, average_wait_time, is_active, status, subscription_status, rating, review_count, phone))',
    )
    .eq('is_active', true)
    .eq('status', 'active')
    .limit(120);

  const like = sanitizeIlike(query);
  if (like) {
    builder = builder.or(`name.ilike.%${like}%,description.ilike.%${like}%`);
  }
  if (maxPrice != null) {
    builder = builder.lte('price', maxPrice);
  }

  const { data, error } = await builder;

  if (error || !data) return matched;

  const lower = (like || query).toLowerCase();
  for (const row of data as ServiceJoinRow[]) {
    if (maxPrice != null && (row.price == null || row.price > maxPrice)) continue;
    if (lower) {
      const name = String(row.name ?? '').toLowerCase();
      const description = String(row.description ?? '').toLowerCase();
      if (!name.includes(lower) && !description.includes(lower)) continue;
    }
    const dept = unwrap(row.departments);
    const org = unwrap(dept?.organizations ?? null);
    if (!org || !isPublicOrg(org)) continue;
    const existing = matched.get(org.id);
    if (!existing || (row.price != null && (existing.price == null || row.price < existing.price))) {
      matched.set(org.id, {
        serviceId: row.id,
        serviceName: row.name,
        price: typeof row.price === 'number' ? row.price : null,
      });
    }
  }
  return matched;
}

async function loadStartingPrices(
  ctx: ToolContext,
  orgIds: string[],
): Promise<Map<string, { serviceName: string | null; price: number }>> {
  const result = new Map<string, { serviceName: string | null; price: number }>();
  if (orgIds.length === 0) return result;

  const { data, error } = await ctx.supabase
    .from('services')
    .select(
      'name, price, is_active, status, departments!inner(organization_id, organizations!inner(id, is_active, status, subscription_status))',
    )
    .eq('is_active', true)
    .eq('status', 'active')
    .not('price', 'is', null)
    .in('departments.organization_id', orgIds)
    .limit(200);

  if (error || !data) return result;
  const wanted = new Set(orgIds);

  for (const row of data as Array<{
    name: string;
    price: number | null;
    departments:
      | { organization_id: string }
      | { organization_id: string }[]
      | null;
  }>) {
    const dept = unwrap(row.departments);
    const orgId = dept?.organization_id;
    if (!orgId || !wanted.has(orgId) || typeof row.price !== 'number') continue;
    const current = result.get(orgId);
    if (!current || row.price < current.price) {
      result.set(orgId, { serviceName: row.name, price: row.price });
    }
  }
  return result;
}

async function searchOrganizations(
  ctx: ToolContext,
  args: Record<string, unknown>,
) {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  const city = typeof args.city === 'string' ? args.city.trim().toLowerCase() : '';
  const category = normalizeCategory(args.category);
  const maxPrice =
    typeof args.maxPrice === 'number' && Number.isFinite(args.maxPrice)
      ? args.maxPrice
      : null;
  const nearby = Boolean(args.nearby);
  const maxDistanceKm =
    typeof args.maxDistanceKm === 'number' && Number.isFinite(args.maxDistanceKm)
      ? args.maxDistanceKm
      : nearby
        ? 25
        : null;
  const sort =
    typeof args.sort === 'string' ? args.sort.toLowerCase() : nearby ? 'distance' : 'relevance';
  const favoritesOnly = Boolean(args.favoritesOnly);
  const openOnly = args.openOnly !== false;

  if ((nearby || maxDistanceKm != null || sort === 'distance') && !ctx.location) {
    ctx.ui.locationRequired = true;
    return {
      locationAvailable: false,
      message: LOCATION_UNAVAILABLE_MESSAGE[ctx.replyStyle],
      results: [],
    };
  }

  const favoriteIds = favoritesOnly ? await loadFavoriteOrgIds(ctx) : null;
  if (favoritesOnly && favoriteIds && favoriteIds.size === 0) {
    ctx.ui.favorites = [];
    return { count: 0, results: [] };
  }

  let builder = ctx.supabase
    .from('organizations')
    .select(
      'id, name, description, category, address, city, latitude, longitude, working_hours, average_wait_time, is_active, status, subscription_status, rating, review_count, phone',
    )
    .order('name', { ascending: true });

  if (openOnly) {
    builder = builder
      .eq('is_active', true)
      .eq('status', 'active')
      .eq('subscription_status', 'active');
  }
  if (category !== 'all') {
    builder = builder.eq('category', category);
  }

  const { data, error } = await builder;
  if (error) return { error: 'search_failed', results: [] };

  let orgs = ((data ?? []) as OrgRow[]).filter(isPublicOrg);
  const serviceMatches = await loadMatchingServiceOrgs(ctx, query, maxPrice);

  if (query) {
    const lower = query.toLowerCase();
    orgs = orgs.filter(
      (org) =>
        org.name.toLowerCase().includes(lower) ||
        String(org.description ?? '').toLowerCase().includes(lower) ||
        String(org.city ?? '').toLowerCase().includes(lower) ||
        String(org.address ?? '').toLowerCase().includes(lower) ||
        serviceMatches.has(org.id),
    );
  }

  if (city) {
    orgs = orgs.filter(
      (org) =>
        String(org.city ?? '').toLowerCase().includes(city) ||
        String(org.address ?? '').toLowerCase().includes(city),
    );
  }

  if (favoriteIds) {
    orgs = orgs.filter((org) => favoriteIds.has(org.id));
  }

  if (maxPrice != null) {
    orgs = orgs.filter((org) => {
      const match = serviceMatches.get(org.id);
      return match != null && match.price != null && match.price <= maxPrice;
    });
  }

  const prices = await loadStartingPrices(
    ctx,
    orgs.map((org) => org.id),
  );

  let cards: BusinessCard[] = orgs.map((org) => {
    const match = serviceMatches.get(org.id);
    const starting = prices.get(org.id);
    return toBusinessCard(org, {
      distanceKm: distanceKm(org, ctx.location),
      serviceId: match?.serviceId ?? null,
      serviceName: match?.serviceName ?? starting?.serviceName ?? null,
      price: match?.price ?? starting?.price ?? null,
    });
  });

  if (maxDistanceKm != null && ctx.location) {
    cards = cards.filter(
      (card) => card.distanceKm != null && card.distanceKm <= maxDistanceKm,
    );
  }

  cards.sort((a, b) => {
    if (sort === 'distance') {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
    } else if (sort === 'price') {
      const pa = a.price ?? Number.POSITIVE_INFINITY;
      const pb = b.price ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
    } else if (sort === 'name') {
      return a.name.localeCompare(b.name);
    } else if (query) {
      const score = (card: BusinessCard) => {
        const name = card.name.toLowerCase();
        const q = query.toLowerCase();
        if (name.startsWith(q)) return 0;
        if (name.includes(q)) return 1;
        if (card.serviceName?.toLowerCase().includes(q)) return 2;
        return 3;
      };
      const diff = score(a) - score(b);
      if (diff !== 0) return diff;
    }
    return a.name.localeCompare(b.name);
  });

  const limited = cards.slice(0, MAX_RESULTS);
  ctx.ui.cards = limited;
  return {
    count: limited.length,
    totalMatched: cards.length,
    locationAvailable: Boolean(ctx.location),
    results: limited,
  };
}

async function searchServices(ctx: ToolContext, args: Record<string, unknown>) {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  if (!query) return { count: 0, results: [] };

  const nearby = Boolean(args.nearby);
  const maxPrice =
    typeof args.maxPrice === 'number' && Number.isFinite(args.maxPrice)
      ? args.maxPrice
      : null;
  const maxDistanceKm =
    typeof args.maxDistanceKm === 'number' && Number.isFinite(args.maxDistanceKm)
      ? args.maxDistanceKm
      : nearby
        ? 25
        : null;

  if ((nearby || maxDistanceKm != null) && !ctx.location) {
    ctx.ui.locationRequired = true;
    return {
      locationAvailable: false,
      message: LOCATION_UNAVAILABLE_MESSAGE[ctx.replyStyle],
      results: [],
    };
  }

  const matches = await loadMatchingServiceOrgs(ctx, query, maxPrice);
  if (matches.size === 0) return { count: 0, results: [] };

  const orgIds = [...matches.keys()];
  const { data, error } = await ctx.supabase
    .from('organizations')
    .select(
      'id, name, description, category, address, city, latitude, longitude, working_hours, average_wait_time, is_active, status, subscription_status, rating, review_count, phone',
    )
    .in('id', orgIds);

  if (error) return { error: 'search_failed', results: [] };

  let cards: BusinessCard[] = ((data ?? []) as OrgRow[])
    .filter(isPublicOrg)
    .map((org) => {
      const match = matches.get(org.id);
      return toBusinessCard(org, {
        distanceKm: distanceKm(org, ctx.location),
        serviceId: match?.serviceId ?? null,
        serviceName: match?.serviceName ?? null,
        price: match?.price ?? null,
      });
    });

  if (maxDistanceKm != null && ctx.location) {
    cards = cards.filter(
      (card) => card.distanceKm != null && card.distanceKm <= maxDistanceKm,
    );
  }

  cards.sort((a, b) => {
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    const pa = a.price ?? Number.POSITIVE_INFINITY;
    const pb = b.price ?? Number.POSITIVE_INFINITY;
    return pa - pb;
  });

  const limited = cards.slice(0, MAX_RESULTS);
  ctx.ui.cards = limited;
  return { count: limited.length, results: limited };
}

async function getOrganizationDetails(
  ctx: ToolContext,
  args: Record<string, unknown>,
) {
  const organizationId =
    typeof args.organizationId === 'string' ? args.organizationId.trim() : '';
  if (!organizationId) return { error: 'missing_organization_id' };

  const { data: org, error } = await ctx.supabase
    .from('organizations')
    .select(
      'id, name, description, category, address, city, latitude, longitude, working_hours, average_wait_time, is_active, status, subscription_status, rating, review_count, phone',
    )
    .eq('id', organizationId)
    .maybeSingle();

  if (error || !org || !isPublicOrg(org as OrgRow)) {
    return { found: false };
  }

  const row = org as OrgRow;
  const { data: departments } = await ctx.supabase
    .from('departments')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('status', 'active')
    .order('display_order', { ascending: true });

  const deptIds = (departments ?? []).map((d: { id: string }) => d.id);
  let services: Array<{
    id: string;
    name: string;
    price: number | null;
    durationMinutes: number | null;
  }> = [];

  if (deptIds.length > 0) {
    const { data: serviceRows } = await ctx.supabase
      .from('services')
      .select('id, name, price, estimated_duration, department_id')
      .in('department_id', deptIds)
      .eq('is_active', true)
      .eq('status', 'active')
      .order('display_order', { ascending: true });
    services = (serviceRows ?? []).map(
      (s: {
        id: string;
        name: string;
        price: number | null;
        estimated_duration: number | null;
      }) => ({
        id: s.id,
        name: s.name,
        price: typeof s.price === 'number' ? s.price : null,
        durationMinutes:
          typeof s.estimated_duration === 'number' ? s.estimated_duration : null,
      }),
    );
  }

  const card = toBusinessCard(row, {
    distanceKm: distanceKm(row, ctx.location),
    serviceId: services[0]?.id ?? null,
    serviceName: services[0]?.name ?? null,
    price: services.find((s) => s.price != null)?.price ?? null,
  });
  ctx.ui.cards = [card];

  return {
    found: true,
    organization: {
      ...card,
      description: row.description ?? '',
      phone: row.phone ?? null,
      departments: (departments ?? []).map((d: { name: string }) => d.name),
      services,
    },
  };
}

async function getNearbyOrganizations(
  ctx: ToolContext,
  args: Record<string, unknown>,
) {
  return searchOrganizations(ctx, {
    ...args,
    nearby: true,
    sort: 'distance',
  });
}

async function getCustomerActiveTicket(ctx: ToolContext) {
  const { data, error } = await ctx.supabase
    .from('tickets')
    .select('id, status, created_at')
    .eq('user_id', ctx.userId)
    .in('status', [...ACTIVE_TICKET_STATUSES])
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return { error: 'ticket_lookup_failed', hasActiveTicket: false };
  const ids = (data ?? []).map((row: { id: string }) => row.id);
  if (ids.length === 0) {
    ctx.ui.ticket = null;
    return { hasActiveTicket: false };
  }

  for (const id of ids) {
    const { data: payload } = await ctx.supabase.rpc('build_queue_ticket_payload', {
      p_ticket_id: id,
    });
    const ticket = await mapTicketPayload(payload);
    if (!ticket) continue;
    const active =
      ticket.status === 'waiting' ||
      ticket.status === 'called' ||
      ticket.status === 'serving' ||
      ticket.status === 'almost';
    if (!active) continue;
    ctx.ui.ticket = ticket;
    return { hasActiveTicket: true, ticket };
  }

  ctx.ui.ticket = null;
  return { hasActiveTicket: false };
}

async function getCustomerTickets(ctx: ToolContext, args: Record<string, unknown>) {
  const limit = Math.min(
    12,
    Math.max(1, typeof args.limit === 'number' ? Math.floor(args.limit) : 8),
  );

  const { data, error } = await ctx.supabase
    .from('tickets')
    .select('id')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { error: 'ticket_lookup_failed', tickets: [] };

  const tickets: TicketCard[] = [];
  for (const row of data ?? []) {
    const { data: payload } = await ctx.supabase.rpc('build_queue_ticket_payload', {
      p_ticket_id: row.id,
    });
    const ticket = await mapTicketPayload(payload);
    if (ticket) tickets.push(ticket);
  }

  const active = tickets.find(
    (t) =>
      t.status === 'waiting' ||
      t.status === 'called' ||
      t.status === 'serving' ||
      t.status === 'almost',
  );
  if (active) ctx.ui.ticket = active;
  ctx.ui.history = tickets
    .filter(
      (t) =>
        t.status === 'served' ||
        t.status === 'completed' ||
        t.status === 'cancelled' ||
        t.status === 'skipped',
    )
    .map((t) => ({
      id: t.id,
      organizationName: t.organizationName,
      organizationId: t.organizationId,
      serviceName: t.serviceName,
      status: t.status,
      visitedAt: '',
    }));

  return { count: tickets.length, tickets };
}

async function getCustomerFavorites(
  ctx: ToolContext,
  args: Record<string, unknown>,
) {
  const query = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
  const { data, error } = await ctx.supabase
    .from('favorites')
    .select(
      'organization_id, organizations(id, name, category, city, address, is_active, status, subscription_status)',
    )
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  if (error) return { error: 'favorites_lookup_failed', results: [] };

  const favorites: FavoriteCard[] = [];
  for (const row of data ?? []) {
    const org = unwrap(
      (row as { organizations?: OrgRow | OrgRow[] | null }).organizations,
    );
    if (!org || !isPublicOrg(org)) continue;
    if (
      query &&
      !org.name.toLowerCase().includes(query) &&
      !String(org.category ?? '').toLowerCase().includes(query) &&
      !String(org.city ?? '').toLowerCase().includes(query)
    ) {
      continue;
    }
    favorites.push({
      id: org.id,
      name: org.name,
      category: org.category ?? 'other',
      city: org.city ?? '',
      address: org.address ?? '',
    });
  }

  ctx.ui.favorites = favorites.slice(0, MAX_RESULTS);
  return { count: ctx.ui.favorites.length, results: ctx.ui.favorites };
}

async function getCustomerHistory(
  ctx: ToolContext,
  args: Record<string, unknown>,
) {
  const limit = Math.min(
    12,
    Math.max(1, typeof args.limit === 'number' ? Math.floor(args.limit) : 8),
  );

  const { data, error } = await ctx.supabase
    .from('tickets')
    .select('id, updated_at, status')
    .eq('user_id', ctx.userId)
    .in('status', [...HISTORY_TICKET_STATUSES])
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) return { error: 'history_lookup_failed', results: [] };

  const history: HistoryCard[] = [];
  for (const row of data ?? []) {
    const { data: payload } = await ctx.supabase.rpc('build_queue_ticket_payload', {
      p_ticket_id: row.id,
    });
    const ticket = await mapTicketPayload(payload);
    if (!ticket) continue;
    history.push({
      id: ticket.id,
      organizationName: ticket.organizationName,
      organizationId: ticket.organizationId,
      serviceName: ticket.serviceName,
      status: ticket.status,
      visitedAt: String(
        (row as { updated_at?: string }).updated_at ?? '',
      ),
    });
  }

  ctx.ui.history = history;
  return { count: history.length, results: history };
}
