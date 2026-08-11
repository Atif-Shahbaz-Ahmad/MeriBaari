import type { Organization as DomainOrganization } from '@/domain/models';
import type { Department as DomainDepartment } from '@/domain/models';
import type { Service as DomainService } from '@/domain/models';
import type { AppNotification } from '@/types/profile';
import type { Department, Organization, QueueService } from '@/types';
import type { Notification as DomainNotification } from '@/domain/models';
import {
  getOrganizationCategoryIcon,
  normalizeOrganizationCategory,
} from '@/constants/organization-categories';
import { DEPARTMENT_ICON_IDS } from '@/domain/models/department';
import type { DepartmentIcon } from '@/domain/models';

/** Enrich catalog organization rows with domain/DB fields. */
export function toDomainOrganization(org: Organization): DomainOrganization {
  const category = normalizeOrganizationCategory(org.category);
  const logoUrl = org.logoUrl ?? null;
  const wait = org.averageWaitMinutes ?? 0;
  const now = new Date().toISOString();

  return {
    id: org.id,
    ownerId: null,
    name: org.name,
    description: org.description,
    logoUrl,
    logo: logoUrl,
    category,
    phone: org.phone ?? null,
    email: org.email ?? null,
    address: org.address,
    city: org.city,
    latitude: null,
    longitude: null,
    averageWaitTime: wait,
    isActive: org.isActive ?? true,
    status: org.status ?? 'active',
    workingHours: org.workingHours,
    createdAt: now,
    updatedAt: now,
    averageWaitMinutes: wait,
    activeQueues: org.activeQueues,
    distanceKm: org.distanceKm,
    rating: org.rating,
    reviewCount: org.reviewCount,
    currentVisitors: org.currentVisitors,
    averageServiceMinutes: org.averageServiceMinutes,
    todaysVisitors: org.todaysVisitors,
    liveQueueCount: org.liveQueueCount,
    featured: org.featured,
    popular: org.popular,
    nearby: org.nearby,
    recentlyVisited: org.recentlyVisited,
    logoIcon: org.logoIcon ?? getOrganizationCategoryIcon(category),
    departmentIds: org.departmentIds,
    popularServiceIds: org.popularServiceIds,
  };
}

function normalizeIcon(icon: string): DepartmentIcon {
  if ((DEPARTMENT_ICON_IDS as readonly string[]).includes(icon)) {
    return icon as DepartmentIcon;
  }
  return 'users';
}

export function toDomainDepartment(dept: Department): DomainDepartment {
  const isActive =
    dept.isActive ?? (dept.availability === 'closed' ? false : true);
  const now = new Date().toISOString();

  return {
    id: dept.id,
    organizationId: dept.organizationId,
    name: dept.name,
    description: dept.description,
    icon: normalizeIcon(dept.icon),
    isActive,
    displayOrder: dept.displayOrder ?? 0,
    createdAt: dept.createdAt ?? now,
    updatedAt: dept.updatedAt ?? now,
    estimatedServiceTime: dept.averageWaitMinutes,
    status: isActive ? 'active' : 'inactive',
    averageWaitMinutes: dept.averageWaitMinutes,
    estimatedQueueSize: dept.estimatedQueueSize,
    availability: dept.availability,
    serviceIds: dept.serviceIds,
  };
}

export function toDomainService(service: QueueService): DomainService {
  const duration = service.estimatedDurationMinutes;
  const isActive =
    service.isActive ?? (service.availability === 'closed' ? false : true);
  const now = new Date().toISOString();

  return {
    id: service.id,
    departmentId: service.departmentId,
    organizationId: service.organizationId,
    name: service.name,
    description: service.description,
    durationMinutes: duration,
    estimatedDuration: duration,
    estimatedDurationMinutes: duration,
    price: service.price ?? null,
    isActive,
    displayOrder: service.displayOrder ?? 0,
    createdAt: service.createdAt ?? now,
    updatedAt: service.updatedAt ?? now,
    status: isActive ? 'active' : 'inactive',
    averageWaitMinutes: service.averageWaitMinutes,
    peopleAhead: service.peopleAhead,
    availability: service.availability,
  };
}

export function toAppNotification(
  n: DomainNotification | AppNotification,
): AppNotification {
  if ('message' in n && typeof (n as DomainNotification).userId === 'string') {
    const domain = n as DomainNotification;
    return {
      id: domain.id,
      userId: domain.userId,
      title: domain.title,
      message: domain.message,
      description: domain.message,
      type: domain.type,
      category: domain.category,
      createdAt: domain.createdAt,
      read: domain.isRead,
      isRead: domain.isRead,
      ticketId: domain.ticketId ?? null,
      queueId: domain.queueId ?? null,
      organizationId: domain.organizationId ?? null,
      readAt: domain.readAt ?? null,
      eventKey: domain.eventKey ?? null,
    };
  }

  const ui = n as AppNotification;
  const message = ui.message ?? ui.description;
  return {
    ...ui,
    message,
    description: message,
    isRead: ui.isRead ?? ui.read,
    read: ui.isRead ?? ui.read,
  };
}

export function toDomainNotification(
  n: AppNotification,
  userId = 'current-user',
): DomainNotification {
  const message = n.message ?? n.description;
  return {
    id: n.id,
    userId: n.userId ?? userId,
    title: n.title,
    message,
    type: n.type,
    category: n.category,
    createdAt: n.createdAt,
    isRead: n.isRead ?? n.read,
    ticketId: n.ticketId ?? null,
    queueId: n.queueId ?? null,
    organizationId: n.organizationId ?? null,
    readAt: n.readAt ?? null,
    eventKey: n.eventKey ?? null,
  };
}
