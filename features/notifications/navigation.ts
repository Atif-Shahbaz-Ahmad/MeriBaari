import { Alert } from 'react-native';

import type { AppNotification } from '@/types';
import { AuthHref } from '@/features/auth/navigation';
import { pushOrganization } from '@/features/queue/navigation';
import { pushTicketDetail } from '@/features/tickets/navigation';
import { router } from 'expo-router';

/**
 * Navigate from a notification tap without crashing on missing data.
 */
export function navigateFromNotification(notification: AppNotification): void {
  try {
    if (notification.ticketId) {
      pushTicketDetail(notification.ticketId);
      return;
    }

    if (notification.organizationId) {
      pushOrganization(notification.organizationId);
      return;
    }

    if (notification.type === 'SYSTEM') {
      router.push(AuthHref.customerHome);
      return;
    }

    if (notification.queueId) {
      // Customer app has no dedicated queue screen — fall back to tickets.
      router.push(AuthHref.customerTickets);
      return;
    }

    router.push(AuthHref.customerNotifications);
  } catch (error) {
    if (__DEV__) {
      console.warn('[notifications] navigation failed', error);
    }
    Alert.alert(
      'Unavailable',
      'This notification link is no longer available.',
    );
  }
}
