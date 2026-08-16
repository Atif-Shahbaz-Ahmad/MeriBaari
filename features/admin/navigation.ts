import { router, type Href } from 'expo-router';

import { AuthHref } from '@/features/auth/navigation';

export const AdminHref = {
  home: '/(admin)' as Href,
  payment: (id: string) => `/(admin)/payments/${id}` as Href,
  business: (id: string) => `/(admin)/businesses/${id}` as Href,
} as const;

export function replaceAdminHome() {
  router.replace(AdminHref.home);
}

export function pushAdminPayment(id: string) {
  router.push(AdminHref.payment(id));
}

export function pushAdminBusiness(id: string) {
  router.push(AdminHref.business(id));
}

export function replaceSafeHome() {
  router.replace(AuthHref.welcome);
}
