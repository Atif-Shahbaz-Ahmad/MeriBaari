import type { Session, User } from '@supabase/supabase-js';

import type {
  Department,
  DepartmentIcon,
  Organization,
  Profile,
  Queue,
  QueueEntry,
  QueueJoinPreview,
  QueueTicket,
  Service,
  Ticket,
  TicketStatus,
} from '@/domain/models';
import type { QueueStatus as DomainQueueStatus } from '@/domain/models/queue';
import type { QueueEntryStatus } from '@/domain/models/queue-entry';
import { DEPARTMENT_ICON_IDS } from '@/domain/models/department';
import {
  getOrganizationCategoryIcon,
  normalizeOrganizationCategory,
} from '@/constants/organization-categories';
import { normalizeRole } from '@/features/auth/roles';
import type { AuthMethod, AuthSession, AuthUser } from '@/types/auth';
import type {
  DepartmentRow,
  OrganizationRow,
  ProfileRow,
  QueueEntryRow,
  QueueRow,
  ServiceRow,
  TicketRow,
} from '@/supabase/types';

export function mapAuthUser(user: User, role?: AuthUser['role']): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    avatarUrl:
      (user.user_metadata?.avatar_url as string | undefined) ?? null,
    role: role ?? normalizeRole(user.user_metadata?.role) ?? null,
  };
}

export function mapAuthSession(
  session: Session,
  role?: AuthUser['role'],
): AuthSession {
  const provider = session.user.app_metadata?.provider as string | undefined;
  const method: AuthMethod =
    provider === 'google'
      ? 'google'
      : session.user.phone
        ? 'phone'
        : session.user.email
          ? 'email'
          : 'demo';

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    method,
    user: mapAuthUser(session.user, role),
  };
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: normalizeRole(row.role),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mergeSessionWithProfile(
  session: AuthSession,
  profile: Profile | null,
): AuthSession {
  if (!profile) return session;
  return {
    ...session,
    user: {
      ...session.user,
      fullName: profile.fullName ?? session.user.fullName,
      phone: profile.phone ?? session.user.phone,
      email: profile.email ?? session.user.email,
      avatarUrl: profile.avatarUrl ?? session.user.avatarUrl,
      role: profile.role ?? session.user.role ?? null,
    },
  };
}

export function mapOrganizationRow(row: OrganizationRow): Organization {
  const category = normalizeOrganizationCategory(row.category);
  const averageWait = row.average_wait_time ?? 0;
  const logoUrl = row.logo_url ?? null;
  const isActive = row.is_active ?? row.status === 'active';

  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description ?? '',
    logoUrl,
    logo: logoUrl,
    category,
    phone: row.phone,
    email: row.email,
    address: row.address ?? '',
    city: row.city ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    averageWaitTime: averageWait,
    isActive,
    status: row.status,
    workingHours: row.working_hours ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    averageWaitMinutes: averageWait,
    activeQueues: 0,
    distanceKm: 0,
    rating: 0,
    reviewCount: 0,
    currentVisitors: 0,
    averageServiceMinutes: 0,
    todaysVisitors: 0,
    liveQueueCount: 0,
    featured: false,
    popular: false,
    nearby: false,
    recentlyVisited: false,
    logoIcon: getOrganizationCategoryIcon(category),
    departmentIds: [],
    popularServiceIds: [],
  };
}

function normalizeDepartmentIcon(value: string | null | undefined): DepartmentIcon {
  if (value && (DEPARTMENT_ICON_IDS as readonly string[]).includes(value)) {
    return value as DepartmentIcon;
  }
  return 'users';
}

export function mapDepartmentRow(row: DepartmentRow): Department {
  const isActive = row.is_active ?? row.status === 'active';
  const estimated = row.estimated_service_time ?? 10;

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description ?? '',
    icon: normalizeDepartmentIcon(row.icon),
    isActive,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    estimatedServiceTime: estimated,
    averageWaitMinutes: estimated,
    estimatedQueueSize: 0,
    availability: isActive ? 'open' : 'closed',
    serviceIds: [],
  };
}

export function mapServiceRow(row: ServiceRow, organizationId = ''): Service {
  const duration = row.estimated_duration ?? 10;
  const isActive = row.is_active ?? row.status === 'active';
  const price =
    row.price === null || row.price === undefined ? null : Number(row.price);

  return {
    id: row.id,
    departmentId: row.department_id,
    organizationId,
    name: row.name,
    description: row.description ?? '',
    durationMinutes: duration,
    estimatedDuration: duration,
    estimatedDurationMinutes: duration,
    price: Number.isFinite(price) ? price : null,
    isActive,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    averageWaitMinutes: duration,
    peopleAhead: 0,
    availability: isActive ? 'open' : 'closed',
  };
}

export function mapDbQueueStatus(
  status: string | null | undefined,
): DomainQueueStatus {
  if (status === 'paused') return 'paused';
  if (status === 'closed') return 'closed';
  // DB 'active' and 'open' both mean joinable
  return 'open';
}

export function mapDomainQueueStatusToDb(
  status: DomainQueueStatus,
): 'active' | 'paused' | 'closed' {
  if (status === 'paused') return 'paused';
  if (status === 'closed') return 'closed';
  return 'active';
}

export function mapQueueRow(row: QueueRow): Queue {
  const avg = row.average_service_time ?? row.average_waiting_time ?? 10;
  const current =
    row.current_number || row.current_serving_number || '';

  return {
    id: row.id,
    organizationId: row.organization_id,
    departmentId: row.department_id,
    serviceId: row.service_id ?? '',
    status: mapDbQueueStatus(row.status),
    currentNumber: current,
    currentServingNumber: current,
    nextNumber: row.next_number ?? 1,
    averageServiceTime: avg,
    averageWaitingTime: avg,
    totalWaiting: row.total_waiting ?? 0,
    prefix: row.prefix ?? 'A',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    waitingCount: row.total_waiting ?? 0,
  };
}

export function mapQueueEntryRow(row: QueueEntryRow): QueueEntry {
  const userId = row.customer_id;
  const servedAt = row.served_at ?? row.completed_at;
  const status = row.status as QueueEntryStatus;

  return {
    id: row.id,
    queueId: row.queue_id,
    userId,
    customerId: userId,
    serviceId: row.service_id,
    ticketNumber: row.ticket_number,
    position: row.position,
    status,
    joinedAt: row.joined_at,
    calledAt: row.called_at,
    servedAt,
    completedAt: servedAt,
    cancelledAt: row.cancelled_at,
    estimatedWaitMinutes: row.estimated_wait_minutes ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTicketRow(row: TicketRow): Ticket {
  const created = row.created_at ?? row.generated_at;
  const status = normalizeTicketStatus(row.status);

  return {
    id: row.id,
    queueEntryId: row.queue_entry_id,
    userId: row.user_id ?? '',
    queueId: row.queue_id ?? '',
    organizationId: row.organization_id ?? '',
    departmentId: row.department_id ?? '',
    serviceId: row.service_id ?? '',
    ticketNumber: row.ticket_number ?? '',
    status,
    qrCode: row.qr_code,
    createdAt: created,
    updatedAt: row.updated_at ?? created,
    generatedAt: row.generated_at ?? created,
  };
}

function normalizeTicketStatus(status: string | null | undefined): TicketStatus {
  if (status === 'served' || status === 'completed') return 'completed';
  if (status === 'called') return 'called';
  if (status === 'serving') return 'serving';
  if (status === 'skipped') return 'skipped';
  if (status === 'cancelled' || status === 'missed') return 'cancelled';
  if (status === 'almost') return 'almost';
  return 'waiting';
}

type QueueTicketPayload = {
  id?: string;
  ticketNumber?: string;
  queueId?: string;
  organizationId?: string;
  locationName?: string;
  organizationName?: string;
  departmentId?: string;
  departmentName?: string;
  serviceId?: string;
  serviceName?: string;
  status?: string;
  position?: number;
  peopleAhead?: number;
  estimatedWaitMinutes?: number;
  currentServing?: string;
  joinedAt?: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  estimatedCompletionAt?: string | null;
  reminderEnabled?: boolean;
  queueEntryId?: string;
  qrCode?: string;
  queueStatus?: string;
  organizationCategory?: string | null;
};

export function mapQueueTicketPayload(raw: unknown): QueueTicket {
  const p = (raw ?? {}) as QueueTicketPayload;
  const category = normalizeOrganizationCategory(p.organizationCategory ?? undefined);
  const status = normalizeTicketStatus(p.status);
  const orgName = p.organizationName ?? p.locationName ?? '';

  return {
    id: p.id ?? '',
    ticketNumber: p.ticketNumber ?? '',
    queueId: p.queueId ?? '',
    organizationId: p.organizationId ?? '',
    locationName: p.locationName ?? orgName,
    organizationName: orgName,
    departmentId: p.departmentId ?? '',
    departmentName: p.departmentName ?? '',
    serviceId: p.serviceId ?? '',
    serviceName: p.serviceName ?? '',
    status,
    position: p.position ?? 0,
    peopleAhead: p.peopleAhead ?? 0,
    estimatedWaitMinutes: p.estimatedWaitMinutes ?? 0,
    currentServing: p.currentServing ?? '—',
    joinedAt: p.joinedAt ?? new Date().toISOString(),
    completedAt: p.completedAt ?? undefined,
    cancelledAt: p.cancelledAt ?? undefined,
    estimatedCompletionAt: p.estimatedCompletionAt ?? undefined,
    reminderEnabled: p.reminderEnabled ?? true,
    queueEntryId: p.queueEntryId,
    qrCode: p.qrCode,
    queueStatus: mapDbQueueStatus(p.queueStatus),
    logoIcon: getOrganizationCategoryIcon(category),
  };
}

export function mapJoinPreviewPayload(raw: unknown): QueueJoinPreview {
  const p = (raw ?? {}) as {
    queueId?: string | null;
    queueStatus?: string;
    currentServing?: string;
    waitingCount?: number;
    estimatedWaitMinutes?: number;
    averageServiceTime?: number;
    canJoin?: boolean;
  };

  return {
    queueId: p.queueId ?? null,
    queueStatus: mapDbQueueStatus(p.queueStatus),
    currentServing: p.currentServing ?? '—',
    waitingCount: p.waitingCount ?? 0,
    estimatedWaitMinutes: p.estimatedWaitMinutes ?? 0,
    averageServiceTime: p.averageServiceTime ?? 10,
    canJoin: p.canJoin ?? true,
  };
}
