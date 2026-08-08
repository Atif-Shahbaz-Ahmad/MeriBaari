import { router, type Href } from 'expo-router';

/** Join Queue hrefs — cast until Expo typed routes regenerate. */
export const JoinQueueHref = {
  list: '/join-queue' as Href,
  organization: (orgId: string) => `/join-queue/${orgId}` as Href,
  departments: (orgId: string) => `/join-queue/${orgId}/departments` as Href,
  services: (orgId: string) => `/join-queue/${orgId}/services` as Href,
  confirm: '/join-queue/confirm' as Href,
  success: '/join-queue/success' as Href,
};

export function pushJoinQueueList() {
  router.push(JoinQueueHref.list);
}

export function pushOrganization(orgId: string) {
  router.push(JoinQueueHref.organization(orgId));
}

export function pushDepartments(orgId: string) {
  router.push(JoinQueueHref.departments(orgId));
}

export function pushServices(orgId: string) {
  router.push(JoinQueueHref.services(orgId));
}

export function pushConfirm() {
  router.push(JoinQueueHref.confirm);
}

export function replaceSuccess() {
  router.replace(JoinQueueHref.success);
}

export function replaceJoinQueueList() {
  router.replace(JoinQueueHref.list);
}
