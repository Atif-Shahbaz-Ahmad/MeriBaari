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
  NotificationService,
  OrganizationService,
  OrganizationStructureService,
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
import {
  SupabaseAuthRepository,
  SupabaseProfileRepository,
} from '@/data/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Application dependency container.
 *
 * Auth + Profile use Supabase when configured; everything else stays mock
 * until those domains are wired.
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
  departmentService: OrganizationStructureService;
  serviceService: ServiceService;
  queueService: QueueService;
  ticketService: TicketService;
  notificationService: NotificationService;
  businessService: BusinessService;
  catalogService: CatalogService;

  realtimeService: RealtimeService;
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

  const organizationRepository = new MockOrganizationRepository();
  const departmentRepository = new MockDepartmentRepository();
  const serviceRepository = new MockServiceRepository();
  const queueRepository = new MockQueueRepository();
  const queueEntryRepository = new MockQueueEntryRepository();
  const ticketRepository = new MockTicketRepository();
  const notificationRepository = new MockNotificationRepository();
  const businessSettingsRepository = new MockBusinessSettingsRepository();
  const catalogRepository = new MockCatalogRepository();

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
    departmentService: new OrganizationStructureService(
      departmentRepository,
      serviceRepository,
    ),
    serviceService: new ServiceService(serviceRepository),
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

    realtimeService: new UnimplementedRealtimeService(),
    pushNotificationService: new UnimplementedPushNotificationService(),
    qrValidationService: new UnimplementedQrValidationService(),
    fileStorageService: new UnimplementedFileStorageService(),

    mockTicketRepository: ticketRepository,
    mockNotificationRepository: notificationRepository,
    mockBusinessSettingsRepository: businessSettingsRepository,
    mockQueueRepository: queueRepository,
    mockQueueEntryRepository: queueEntryRepository,
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
