import type { NotificationPreferences } from '@/domain/models/notification';
import type { NotificationTemplate } from '@/domain/notifications/templates';

export type NotificationChannelKind =
  | 'in_app'
  | 'push'
  | 'email'
  | 'whatsapp';

/**
 * Outbound delivery target. Queue logic never depends on a specific channel.
 * In-app delivery is primarily performed by secure DB functions; channels
 * prepare Push / Email / WhatsApp for later prompts.
 */
export interface OutboundNotification extends NotificationTemplate {
  userId: string;
}

export interface NotificationChannel {
  readonly kind: NotificationChannelKind;
  isEnabled(preferences: NotificationPreferences): boolean;
  /**
   * Deliver (or acknowledge) a notification on this channel.
   * In-app: no-op when already persisted by Postgres.
   * Future channels: send push/email/WhatsApp.
   */
  deliver(notification: OutboundNotification): Promise<void>;
}

export class InAppNotificationChannel implements NotificationChannel {
  readonly kind = 'in_app' as const;

  isEnabled(preferences: NotificationPreferences): boolean {
    return preferences.inApp !== false;
  }

  async deliver(_notification: OutboundNotification): Promise<void> {
    // Persisted by SECURITY DEFINER create_notification / queue RPCs.
  }
}

/** Stub for client-side channel fan-out — actual Expo delivery is server-side. */
export class PushNotificationChannel implements NotificationChannel {
  readonly kind = 'push' as const;

  isEnabled(preferences: NotificationPreferences): boolean {
    return preferences.push === true;
  }

  async deliver(_notification: OutboundNotification): Promise<void> {
    // Push is delivered by Edge Function `send-push-notification`
    // after the in-app notification row is inserted (Postgres trigger).
  }
}

/** Stub — later */
export class EmailNotificationChannel implements NotificationChannel {
  readonly kind = 'email' as const;

  isEnabled(preferences: NotificationPreferences): boolean {
    return preferences.email === true;
  }

  async deliver(_notification: OutboundNotification): Promise<void> {
    /* not configured */
  }
}

/** Stub — later */
export class WhatsAppNotificationChannel implements NotificationChannel {
  readonly kind = 'whatsapp' as const;

  isEnabled(preferences: NotificationPreferences): boolean {
    return preferences.whatsapp === true;
  }

  async deliver(_notification: OutboundNotification): Promise<void> {
    /* not configured */
  }
}

export function createDefaultNotificationChannels(): NotificationChannel[] {
  return [
    new InAppNotificationChannel(),
    new PushNotificationChannel(),
    new EmailNotificationChannel(),
    new WhatsAppNotificationChannel(),
  ];
}
