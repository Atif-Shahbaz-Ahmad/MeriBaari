import type { AppNotification } from '@/types';
import { navigateFromNotification } from '@/features/notifications/navigation';
import { AuthHref } from '@/features/auth/navigation';
import { pushOrganization } from '@/features/queue/navigation';
import { pushTicketDetail } from '@/features/tickets/navigation';
import { router } from 'expo-router';

export interface PushNotificationNavPayload {
  notificationId?: string | null;
  notificationType?: string | null;
  ticketId?: string | null;
  queueId?: string | null;
  organizationId?: string | null;
  eventKey?: string | null;
}

let pendingPayload: PushNotificationNavPayload | null = null;

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parsePushNotificationData(
  data: Record<string, unknown> | undefined | null,
): PushNotificationNavPayload | null {
  if (!data || typeof data !== 'object') return null;

  const ticketId = asString(data.ticketId);
  const queueId = asString(data.queueId);
  const organizationId = asString(data.organizationId);
  const notificationId = asString(data.notificationId);
  const notificationType = asString(data.notificationType);
  const eventKey = asString(data.eventKey);

  if (
    !ticketId &&
    !queueId &&
    !organizationId &&
    !notificationId &&
    !notificationType
  ) {
    return null;
  }

  return {
    notificationId,
    notificationType,
    ticketId,
    queueId,
    organizationId,
    eventKey,
  };
}

export function setPendingPushNavigation(
  payload: PushNotificationNavPayload | null,
): void {
  pendingPayload = payload;
}

export function consumePendingPushNavigation(): PushNotificationNavPayload | null {
  const next = pendingPayload;
  pendingPayload = null;
  return next;
}

export function peekPendingPushNavigation(): PushNotificationNavPayload | null {
  return pendingPayload;
}

/**
 * Navigate after auth/session is ready. Does not expose protected screens when logged out.
 */
export function navigateFromPushPayload(
  payload: PushNotificationNavPayload,
  options?: { isAuthenticated: boolean; role?: string | null },
): boolean {
  const isAuthenticated = options?.isAuthenticated ?? false;
  const role = options?.role ?? null;

  if (!isAuthenticated) {
    setPendingPushNavigation(payload);
    return false;
  }

  try {
    if (payload.ticketId) {
      if (role === 'business') {
        // Business users do not use customer ticket detail deep links yet.
        router.push(AuthHref.businessHome);
        return true;
      }
      pushTicketDetail(payload.ticketId);
      return true;
    }

    if (payload.organizationId) {
      if (role === 'customer') {
        pushOrganization(payload.organizationId);
        return true;
      }
    }

    if (payload.queueId) {
      if (role === 'customer') {
        router.push(AuthHref.customerTickets);
        return true;
      }
      if (role === 'business') {
        router.push(AuthHref.businessHome);
        return true;
      }
    }

    if (role === 'customer') {
      router.push(AuthHref.customerNotifications);
      return true;
    }

    router.push(AuthHref.businessHome);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[push] navigation failed', error);
    }
    return false;
  }
}

/** Bridge AppNotification taps through the same deep-link rules. */
export function navigateFromInAppNotification(notification: AppNotification): void {
  navigateFromNotification(notification);
}
