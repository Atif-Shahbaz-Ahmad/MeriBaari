import { router, type Href } from 'expo-router';

import { AuthHref } from '@/features/auth/navigation';

/** Business queue ops hrefs — cast until Expo typed routes regenerate. */
export const BusinessHref = {
  home: AuthHref.businessHome,
  queueTab: '/(business)/(tabs)/queue' as Href,
  queueDetails: (queueId: string) => `/(business)/queue/${queueId}` as Href,
  queueActivity: (queueId?: string) =>
    (queueId
      ? `/(business)/activity?queueId=${queueId}`
      : '/(business)/activity') as Href,
  walkIn: '/(business)/walk-in' as Href,
  walkInSuccess: '/(business)/walk-in/success' as Href,
} as const;

export function pushQueueDetails(queueId: string) {
  router.push(BusinessHref.queueDetails(queueId));
}

export function pushQueueActivity(queueId?: string) {
  router.push(BusinessHref.queueActivity(queueId));
}

export function pushWalkIn() {
  router.push(BusinessHref.walkIn);
}

export function replaceWalkInSuccess() {
  router.replace(BusinessHref.walkInSuccess);
}

export function replaceBusinessHome() {
  router.replace(BusinessHref.home);
}

export function pushQueueTab() {
  router.push(BusinessHref.queueTab);
}
