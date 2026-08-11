import type {
  AuthRepository,
  BusinessSettingsRepository,
  CatalogRepository,
  DepartmentRepository,
  NotificationRepository,
  OrganizationRepository,
  ProfileRepository,
  QueueEntryRepository,
  QueueRepository,
  ServiceRepository,
  TicketRepository,
} from '@/domain/repositories';
import {
  AuthService,
  BusinessService,
  CatalogService,
  DepartmentService,
  NotificationService,
  OrganizationService,
  ProfileService,
  QueueService,
  ServiceService,
  TicketService,
} from '@/domain/services';
import {
  UnimplementedFileStorageService,
  UnimplementedPushNotificationService,
  UnimplementedQrValidationService,
  UnimplementedRealtimeService,
  type FileStorageService,
  type PushNotificationService,
  type QrValidationService,
  type RealtimeService,
} from '@/domain/future';
import type { NotificationPermissionService } from '@/domain/services/notification-permission.service';
import type { PushTokenRepository } from '@/domain/repositories/push-token.repository';
import {
  MockAuthRepository,
  MockBusinessSettingsRepository,
  MockCatalogRepository,
  MockDepartmentRepository,
  MockNotificationRepository,
  MockOrganizationRepository,
  MockProfileRepository,
  MockQueueEntryRepository,
  MockQueueRepository,
  MockServiceRepository,
  MockTicketRepository,
} from '@/data/mock';
import { MockPushTokenRepository } from '@/data/mock/mock-push-token.repository';
import {
  SupabaseAuthRepository,
  SupabaseDepartmentRepository,
  SupabaseOrganizationRepository,
  SupabaseProfileRepository,
  SupabaseQueueEntryRepository,
  SupabaseQueueRepository,
  SupabaseRealtimeService,
  SupabaseNotificationRepository,
  SupabaseServiceRepository,
  SupabaseTicketRepository,
} from '@/data/supabase';
import { SupabasePushTokenRepository } from '@/data/supabase/supabase-push-token.repository';
import { ExpoNotificationPermissionService } from '@/data/notifications/expo-notification-permission.service';
import { ExpoPushNotificationService } from '@/data/notifications/expo-push-notification.service';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Application dependency container.
 *
 * Auth + Profile + Organizations + Departments + Services + Queues/Tickets
 * + Realtime + Notifications use Supabase when configured; remaining domains
 * stay mock until wired.
 */
export interface AppContainer {
  profileRepository: ProfileRepository;
  organizationRepository: OrganizationRepository;
  departmentRepository: DepartmentRepository;
  serviceRepository: ServiceRepository;
  queueRepository: QueueRepository;
  queueEntryRepository: QueueEntryRepository;
  ticketRepository: TicketRepository;
  notificationRepository: NotificationRepository;
  businessSettingsRepository: BusinessSettingsRepository;
  authRepository: AuthRepository;
  catalogRepository: CatalogRepository;

  authService: AuthService;
  profileService: ProfileService;
  organizationService: OrganizationService;
  departmentService: DepartmentService;
  serviceService: ServiceService;
  queueService: QueueService;
  ticketService: TicketService;
  notificationService: NotificationService;
  businessService: BusinessService;
  catalogService: CatalogService;

  realtimeService: RealtimeService;
  notificationPermissionService: NotificationPermissionService;
  pushTokenRepository: PushTokenRepository;
  pushNotificationService: PushNotificationService;
  qrValidationService: QrValidationService;
  fileStorageService: FileStorageService;

  mockTicketRepository: MockTicketRepository;
  mockNotificationRepository: MockNotificationRepository;
  mockBusinessSettingsRepository: MockBusinessSettingsRepository;
  mockQueueRepository: MockQueueRepository;
  mockQueueEntryRepository: MockQueueEntryRepository;
  mockCatalogRepository: MockCatalogRepository;
}

export function createAppContainer(): AppContainer {
  const useSupabaseAuth = isSupabaseConfigured;

  const profileRepository: ProfileRepository = useSupabaseAuth
    ? new SupabaseProfileRepository()
    : new MockProfileRepository();
  const authRepository: AuthRepository = useSupabaseAuth
    ? new SupabaseAuthRepository()
    : new MockAuthRepository();

  const organizationRepository: OrganizationRepository = useSupabaseAuth
    ? new SupabaseOrganizationRepository()
    : new MockOrganizationRepository();
  const departmentRepository: DepartmentRepository = useSupabaseAuth
    ? new SupabaseDepartmentRepository()
    : new MockDepartmentRepository();
  const serviceRepository: ServiceRepository = useSupabaseAuth
    ? new SupabaseServiceRepository()
    : new MockServiceRepository();
  const queueRepository: QueueRepository = useSupabaseAuth
    ? new SupabaseQueueRepository()
    : new MockQueueRepository();
  const queueEntryRepository: QueueEntryRepository = useSupabaseAuth
    ? new SupabaseQueueEntryRepository()
    : new MockQueueEntryRepository();
  const ticketRepository: TicketRepository = useSupabaseAuth
    ? new SupabaseTicketRepository()
    : new MockTicketRepository();
  const notificationRepository: NotificationRepository = useSupabaseAuth
    ? new SupabaseNotificationRepository()
    : new MockNotificationRepository();
  const businessSettingsRepository = new MockBusinessSettingsRepository();
  const catalogRepository = new MockCatalogRepository();

  const mockQueueRepository =
    queueRepository instanceof MockQueueRepository
      ? queueRepository
      : new MockQueueRepository();
  const mockQueueEntryRepository =
    queueEntryRepository instanceof MockQueueEntryRepository
      ? queueEntryRepository
      : new MockQueueEntryRepository();
  const mockTicketRepository =
    ticketRepository instanceof MockTicketRepository
      ? ticketRepository
      : new MockTicketRepository();
  const mockNotificationRepository =
    notificationRepository instanceof MockNotificationRepository
      ? notificationRepository
      : new MockNotificationRepository();

  const pushTokenRepository: PushTokenRepository = useSupabaseAuth
    ? new SupabasePushTokenRepository()
    : new MockPushTokenRepository();
  const notificationPermissionService = new ExpoNotificationPermissionService();
  const pushNotificationService: PushNotificationService = useSupabaseAuth
    ? new ExpoPushNotificationService(
        notificationPermissionService,
        pushTokenRepository,
      )
    : new UnimplementedPushNotificationService();

  return {
    profileRepository,
    organizationRepository,
    departmentRepository,
    serviceRepository,
    queueRepository,
    queueEntryRepository,
    ticketRepository,
    notificationRepository,
    businessSettingsRepository,
    authRepository,
    catalogRepository,

    authService: new AuthService(authRepository, profileRepository),
    profileService: new ProfileService(profileRepository),
    organizationService: new OrganizationService(organizationRepository),
    departmentService: new DepartmentService(
      departmentRepository,
      organizationRepository,
    ),
    serviceService: new ServiceService(
      serviceRepository,
      departmentRepository,
      organizationRepository,
    ),
    queueService: new QueueService(queueRepository, queueEntryRepository),
    ticketService: new TicketService(ticketRepository),
    notificationService: new NotificationService(notificationRepository),
    businessService: new BusinessService(
      businessSettingsRepository,
      queueRepository,
      queueEntryRepository,
      catalogRepository,
    ),
    catalogService: new CatalogService(catalogRepository, authRepository),

    realtimeService: useSupabaseAuth
      ? new SupabaseRealtimeService()
      : new UnimplementedRealtimeService(),
    notificationPermissionService,
    pushTokenRepository,
    pushNotificationService,
    qrValidationService: new UnimplementedQrValidationService(),
    fileStorageService: new UnimplementedFileStorageService(),

    mockTicketRepository,
    mockNotificationRepository,
    mockBusinessSettingsRepository: businessSettingsRepository,
    mockQueueRepository,
    mockQueueEntryRepository,
    mockCatalogRepository: catalogRepository,
  };
}

/** @deprecated Prefer createAppContainer */
export const createMockContainer = createAppContainer;

let appContainer: AppContainer = createAppContainer();

export function getContainer(): AppContainer {
  return appContainer;
}

export function setContainer(container: AppContainer): void {
  appContainer = container;
}

export const container = new Proxy({} as AppContainer, {
  get(_target, prop: keyof AppContainer) {
    return getContainer()[prop];
  },
});
