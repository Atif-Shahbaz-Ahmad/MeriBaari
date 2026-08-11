export { ProfileService } from './profile.service';
export type { AvatarPlaceholder } from './profile.service';
export { OrganizationService } from './organization.service';
export { DepartmentService } from './department.service';
/** @deprecated Prefer DepartmentService */
export { DepartmentService as OrganizationStructureService } from './department.service';
export { ServiceService } from './service.service';
export { QueueService } from './queue.service';
export { TicketService } from './ticket.service';
export { NotificationService } from './notification.service';
export type {
  NotificationPermissionStatus,
  NotificationPermissionService,
} from './notification-permission.service';
export { BusinessService } from './business.service';
export { CatalogService } from './catalog.service';
export { AuthService } from './auth.service';
export type { AuthenticatedContext } from './auth.service';
