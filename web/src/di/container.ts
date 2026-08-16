import type {
  AuthRepository,
  BusinessSettingsRepository,
  CatalogRepository,
  ChatbotRepository,
  VoiceRepository,
  DepartmentRepository,
  FavoritesRepository,
  NotificationRepository,
  OrganizationRepository,
  ProfileRepository,
  QueueEntryRepository,
  QueueRepository,
  ReviewsRepository,
  ServiceRepository,
  SubscriptionRepository,
  TicketRepository,
} from '@/domain/repositories';
import {
  AuthService,
  BusinessService,
  CatalogService,
  ChatbotService,
  VoiceService,
  DepartmentService,
  FavoritesService,
  NotificationService,
  OrganizationService,
  ProfileService,
  QueueService,
  ReviewsService,
  ServiceService,
  SubscriptionService,
  TicketService,
} from '@/domain/services';
import {
  UnimplementedPushNotificationService,
  UnimplementedRealtimeService,
  type FileStorageService,
  type PushNotificationService,
  type RealtimeService,
} from '@/domain/future';
import type { MicrophonePermissionService } from '@/domain/services/microphone-permission.service';
import type { NotificationPermissionService } from '@/domain/services/notification-permission.service';
import type { PushTokenRepository } from '@/domain/repositories/push-token.repository';
import {
  MockAuthRepository,
  MockBusinessSettingsRepository,
  MockCatalogRepository,
  MockChatbotRepository,
  MockBusinessChatbotRepository,
  MockVoiceRepository,
  MockDepartmentRepository,
  MockFavoritesRepository,
  MockNotificationRepository,
  MockOrganizationRepository,
  MockProfileRepository,
  MockQueueEntryRepository,
  MockQueueRepository,
  MockReviewsRepository,
  MockServiceRepository,
  MockSubscriptionRepository,
  MockTicketRepository,
} from '@/data/mock';
import { MockFileStorageService } from '@/data/mock/mock-file-storage.service';
import { MockPushTokenRepository } from '@/data/mock/mock-push-token.repository';
import {
  SupabaseAuthRepository,
  SupabaseChatbotRepository,
  SupabaseBusinessChatbotRepository,
  SupabaseVoiceRepository,
  SupabaseDepartmentRepository,
  SupabaseFavoritesRepository,
  SupabaseOrganizationRepository,
  SupabaseProfileRepository,
  SupabaseQueueEntryRepository,
  SupabaseQueueRepository,
  SupabaseRealtimeService,
  SupabaseNotificationRepository,
  SupabaseReviewsRepository,
  SupabaseServiceRepository,
  SupabaseSubscriptionRepository,
  SupabaseTicketRepository,
} from '@/data/supabase';
import { SupabaseFileStorageService } from '@/data/supabase/supabase-file-storage.service';
import { SupabasePushTokenRepository } from '@/data/supabase/supabase-push-token.repository';
import { isSupabaseConfigured } from '@/lib/supabase';
import { WebMicrophonePermissionService } from '@web/lib/web-microphone';
import { WebNotificationPermissionService } from '@web/lib/web-notifications';
import { DEFAULT_PREFERENCES, LANGUAGE_OPTIONS, THEME_OPTIONS } from '@/mock/preferences';

export interface AppContainer {
  profileRepository: ProfileRepository;
  organizationRepository: OrganizationRepository;
  departmentRepository: DepartmentRepository;
  serviceRepository: ServiceRepository;
  queueRepository: QueueRepository;
  queueEntryRepository: QueueEntryRepository;
  ticketRepository: TicketRepository;
  notificationRepository: NotificationRepository;
  favoritesRepository: FavoritesRepository;
  reviewsRepository: ReviewsRepository;
  subscriptionRepository: SubscriptionRepository;
  businessSettingsRepository: BusinessSettingsRepository;
  authRepository: AuthRepository;
  catalogRepository: CatalogRepository;
  chatbotRepository: ChatbotRepository;
  businessChatbotRepository: ChatbotRepository;
  voiceRepository: VoiceRepository;
  authService: AuthService;
  profileService: ProfileService;
  organizationService: OrganizationService;
  departmentService: DepartmentService;
  serviceService: ServiceService;
  queueService: QueueService;
  ticketService: TicketService;
  notificationService: NotificationService;
  favoritesService: FavoritesService;
  reviewsService: ReviewsService;
  subscriptionService: SubscriptionService;
  businessService: BusinessService;
  catalogService: CatalogService;
  chatbotService: ChatbotService;
  businessChatbotService: ChatbotService;
  voiceService: VoiceService;
  realtimeService: RealtimeService;
  notificationPermissionService: NotificationPermissionService;
  microphonePermissionService: MicrophonePermissionService;
  pushTokenRepository: PushTokenRepository;
  pushNotificationService: PushNotificationService;
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
  const favoritesRepository: FavoritesRepository = useSupabaseAuth
    ? new SupabaseFavoritesRepository()
    : new MockFavoritesRepository(organizationRepository);
  const reviewsRepository: ReviewsRepository = useSupabaseAuth
    ? new SupabaseReviewsRepository()
    : new MockReviewsRepository(organizationRepository, ticketRepository);
  const subscriptionRepository: SubscriptionRepository = useSupabaseAuth
    ? new SupabaseSubscriptionRepository()
    : new MockSubscriptionRepository(
        organizationRepository instanceof MockOrganizationRepository
          ? organizationRepository
          : undefined,
      );
  const businessSettingsRepository = new MockBusinessSettingsRepository();
  const catalogRepository = new MockCatalogRepository();
  const chatbotRepository: ChatbotRepository = useSupabaseAuth
    ? new SupabaseChatbotRepository()
    : new MockChatbotRepository();
  const businessChatbotRepository: ChatbotRepository = useSupabaseAuth
    ? new SupabaseBusinessChatbotRepository()
    : new MockBusinessChatbotRepository();
  const voiceRepository: VoiceRepository = useSupabaseAuth
    ? new SupabaseVoiceRepository()
    : new MockVoiceRepository();

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
  const notificationPermissionService = new WebNotificationPermissionService();
  const microphonePermissionService = new WebMicrophonePermissionService();
  const pushNotificationService: PushNotificationService =
    new UnimplementedPushNotificationService();
  const fileStorageService: FileStorageService = useSupabaseAuth
    ? new SupabaseFileStorageService()
    : new MockFileStorageService();

  return {
    profileRepository,
    organizationRepository,
    departmentRepository,
    serviceRepository,
    queueRepository,
    queueEntryRepository,
    ticketRepository,
    notificationRepository,
    favoritesRepository,
    reviewsRepository,
    subscriptionRepository,
    businessSettingsRepository,
    authRepository,
    catalogRepository,
    chatbotRepository,
    businessChatbotRepository,
    voiceRepository,
    authService: new AuthService(authRepository, profileRepository),
    profileService: new ProfileService(profileRepository, fileStorageService),
    organizationService: new OrganizationService(
      organizationRepository,
      fileStorageService,
    ),
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
    favoritesService: new FavoritesService(favoritesRepository),
    reviewsService: new ReviewsService(reviewsRepository),
    subscriptionService: new SubscriptionService(
      subscriptionRepository,
      organizationRepository,
      fileStorageService,
    ),
    businessService: new BusinessService(
      businessSettingsRepository,
      queueRepository,
      queueEntryRepository,
      catalogRepository,
    ),
    catalogService: new CatalogService(catalogRepository, authRepository),
    chatbotService: new ChatbotService(chatbotRepository),
    businessChatbotService: new ChatbotService(businessChatbotRepository),
    voiceService: new VoiceService(voiceRepository),
    realtimeService: useSupabaseAuth
      ? new SupabaseRealtimeService()
      : new UnimplementedRealtimeService(),
    notificationPermissionService,
    microphonePermissionService,
    pushTokenRepository,
    pushNotificationService,
    fileStorageService,
    mockTicketRepository,
    mockNotificationRepository,
    mockBusinessSettingsRepository: businessSettingsRepository,
    mockQueueRepository,
    mockQueueEntryRepository,
    mockCatalogRepository: catalogRepository,
  };
}

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

export const dataAccess = {
  DEFAULT_PREFERENCES,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
};
