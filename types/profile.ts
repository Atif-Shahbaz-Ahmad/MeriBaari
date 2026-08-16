export type NotificationCategory = 'queue' | 'reminders' | 'system' | 'promotions';

export type NotificationType =
  | 'QUEUE_JOINED'
  | 'TICKET_CALLED'
  | 'TICKET_SERVING'
  | 'TICKET_SERVED'
  | 'TICKET_SKIPPED'
  | 'QUEUE_PAUSED'
  | 'QUEUE_RESUMED'
  | 'QUEUE_CLOSED'
  | 'QUEUE_TURN_APPROACHING'
  | 'QUEUE_CANCELLED'
  | 'CUSTOMER_JOINED'
  | 'SUBSCRIPTION_PAYMENT_SUBMITTED'
  | 'SUBSCRIPTION_APPROVED'
  | 'SUBSCRIPTION_REJECTED'
  | 'SYSTEM';

/** UI-facing notification — mirrors domain AppNotification. */
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  /** Alias of message for NotificationCard. */
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
  isRead: boolean;
  ticketId: string | null;
  queueId: string | null;
  organizationId: string | null;
  readAt: string | null;
  eventKey?: string | null;
}

export type AppLanguage = 'en' | 'ur';

export interface UserPreferences {
  language: AppLanguage;
  pushEnabled: boolean;
  queueUpdates: boolean;
  reminders: boolean;
  systemAlerts: boolean;
  promotions: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reduceMotion: boolean;
  largerText: boolean;
  highContrast: boolean;
  autoJoinFavorites: boolean;
  showEstimatedWait: boolean;
  shareAnalytics: boolean;
}

export interface ProfileStats {
  queuesJoined: number;
  hoursSaved: number;
  averageWaitingMinutes: number;
  favoriteOrganization: string;
  membershipSince: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'queues' | 'tickets' | 'account';
}

export interface AboutContent {
  version: string;
  description: string;
  mission: string;
  vision: string;
  goal: string;
  technologies: string[];
  team: { name: string; role: string }[];
  supportEmail: string;
  supportPhone: string;
}
