export type NotificationCategory = 'queue' | 'reminders' | 'system' | 'promotions';

export type NotificationType =
  | 'turn_soon'
  | 'turn_next'
  | 'queue_delayed'
  | 'queue_completed'
  | 'counter_changed'
  | 'queue_cancelled'
  | 'org_nearby'
  | 'joined'
  | 'reminder'
  | 'promo';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
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
  social: { label: string; handle: string }[];
  supportEmail: string;
  supportPhone: string;
}
