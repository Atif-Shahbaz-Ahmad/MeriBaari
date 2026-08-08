/**
 * Domain type barrel — single import surface for domain models & enums.
 * Presentation types in `@/types` remain for UI compatibility and re-export
 * overlapping shapes where possible.
 */
export type {
  Profile,
  Organization,
  OrganizationMember,
  OrganizationMemberRole,
  OrganizationStatus,
  AvailabilityStatus,
  OrganizationCategory,
  Department,
  DepartmentStatus,
  Service,
  ServiceStatus,
  QueueServiceEntity,
  Queue,
  DomainQueueStatus,
  QueueEntry,
  QueueEntryStatus,
  Ticket,
  QueueTicket,
  TicketStatus,
  Notification,
  AppNotification,
  NotificationCategory,
  NotificationType,
  BusinessSettings,
  BusinessSettingsPayload,
} from '../models';
