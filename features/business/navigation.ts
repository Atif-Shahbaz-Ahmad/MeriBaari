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
  history: '/(business)/history' as Href,
  reviews: '/(business)/reviews' as Href,
  walkIn: '/(business)/walk-in' as Href,
  walkInSuccess: '/(business)/walk-in/success' as Href,
  createOrganization: '/(business)/organization/create' as Href,
  editOrganization: '/(business)/organization/edit' as Href,
  createDepartment: '/(business)/department/create' as Href,
  departmentDetails: (departmentId: string) =>
    `/(business)/department/${departmentId}` as Href,
  editDepartment: (departmentId: string) =>
    `/(business)/department/${departmentId}/edit` as Href,
  createService: (departmentId: string) =>
    `/(business)/department/${departmentId}/service/create` as Href,
  editService: (departmentId: string, serviceId: string) =>
    `/(business)/department/${departmentId}/service/${serviceId}/edit` as Href,
} as const;

export function pushQueueDetails(queueId: string) {
  router.push(BusinessHref.queueDetails(queueId));
}

export function pushQueueActivity(queueId?: string) {
  router.push(BusinessHref.queueActivity(queueId));
}

export function pushOwnerHistory() {
  router.push(BusinessHref.history);
}

export function pushOwnerReviews() {
  router.push(BusinessHref.reviews);
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

export function pushCreateOrganization() {
  router.push(BusinessHref.createOrganization);
}

export function replaceCreateOrganization() {
  router.replace(BusinessHref.createOrganization);
}

export function pushEditOrganization() {
  router.push(BusinessHref.editOrganization);
}

export function pushCreateDepartment() {
  router.push(BusinessHref.createDepartment);
}

export function pushDepartmentDetails(departmentId: string) {
  router.push(BusinessHref.departmentDetails(departmentId));
}

export function pushEditDepartment(departmentId: string) {
  router.push(BusinessHref.editDepartment(departmentId));
}

export function pushCreateService(departmentId: string) {
  router.push(BusinessHref.createService(departmentId));
}

export function pushEditService(departmentId: string, serviceId: string) {
  router.push(BusinessHref.editService(departmentId, serviceId));
}
