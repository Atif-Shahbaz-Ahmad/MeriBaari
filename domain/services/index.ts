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
export { SubscriptionService } from './subscription.service';
export { FavoritesService } from './favorites.service';
export { ReviewsService } from './reviews.service';
export type {
  NotificationPermissionStatus,
  NotificationPermissionService,
} from './notification-permission.service';
export { BusinessService } from './business.service';
export { CatalogService } from './catalog.service';
export { AuthService } from './auth.service';
export type { AuthenticatedContext } from './auth.service';
export {
  ChatbotService,
  CHATBOT_MAX_INPUT_LENGTH,
  CHATBOT_MAX_CONTEXT_TURNS,
  CHATBOT_REQUEST_TIMEOUT_MS,
  CHATBOT_MAX_TRANSIENT_ATTEMPTS,
} from './chatbot.service';
export {
  VoiceService,
  toSpeakableText,
  VOICE_MIN_DURATION_MS,
  VOICE_MAX_DURATION_MS,
  VOICE_MAX_AUDIO_BYTES,
  VOICE_MAX_TRANSCRIPT_LENGTH,
  VOICE_TRANSCRIBE_TIMEOUT_MS,
  VOICE_SPEAK_TIMEOUT_MS,
  VOICE_COOLDOWN_MS,
  VOICE_MAX_SPEAK_CHARS,
} from './voice.service';
export type {
  MicrophonePermissionStatus,
  MicrophonePermissionService,
} from './microphone-permission.service';
