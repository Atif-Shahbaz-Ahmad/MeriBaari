import type { Organization as DomainOrganization } from '@/domain/models';
import type { Department as DomainDepartment } from '@/domain/models';
import type { Service as DomainService } from '@/domain/models';
import type { AppNotification } from '@/types/profile';
import type { Department, Organization, QueueService } from '@/types';
import type { Notification as DomainNotification } from '@/domain/models';

/** Enrich catalog organization rows with domain/DB fields. */
export function toDomainOrganization(org: Organization): DomainOrganization {
  return {
    ...org,
    logo: null,
    phone: null,
    email: null,
    status: 'active',
  };
}

export function toDomainDepartment(dept: Department): DomainDepartment {
  return {
    ...dept,
    estimatedServiceTime: dept.averageWaitMinutes,
    status: dept.availability === 'closed' ? 'inactive' : 'active',
  };
}

export function toDomainService(service: QueueService): DomainService {
  return {
    ...service,
    estimatedDuration: service.estimatedDurationMinutes,
    estimatedDurationMinutes: service.estimatedDurationMinutes,
    status: service.availability === 'closed' ? 'inactive' : 'active',
  };
}

export function toAppNotification(
  n: DomainNotification | AppNotification,
): AppNotification {
  if ('read' in n && typeof n.read === 'boolean') {
    return {
      ...n,
      read: n.read,
    };
  }
  const domain = n as DomainNotification;
  return {
    id: domain.id,
    title: domain.title,
    description: domain.description,
    type: domain.type,
    category: domain.category,
    createdAt: domain.createdAt,
    read: domain.isRead,
  };
}

export function toDomainNotification(
  n: AppNotification,
  userId = 'current-user',
): DomainNotification {
  return {
    id: n.id,
    userId,
    title: n.title,
    description: n.description,
    type: n.type,
    category: n.category,
    createdAt: n.createdAt,
    isRead: n.read,
  };
}
