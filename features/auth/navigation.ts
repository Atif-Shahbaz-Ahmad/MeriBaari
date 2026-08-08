import type { Href } from 'expo-router';

import type { UserRole } from '@/types';

/** Central auth + post-auth destinations — role comes from `profiles.role`. */
export const AuthHref = {
  onboarding: '/(auth)/onboarding' as Href,
  welcome: '/(auth)/welcome' as Href,
  login: '/(auth)/login' as Href,
  signup: '/(auth)/signup' as Href,
  verifyEmail: '/(auth)/verify-email' as Href,
  forgotPassword: '/(auth)/forgot-password' as Href,
  roleSelect: '/(auth)/role-select' as Href,
  customerHome: '/(customer)/(tabs)' as Href,
  customerTickets: '/(customer)/(tabs)/tickets' as Href,
  customerNotifications: '/(customer)/(tabs)/notifications' as Href,
  businessHome: '/(business)/(tabs)' as Href,
} as const;

export function getHomeHref(role: UserRole | null | undefined): Href {
  if (role === 'business') return AuthHref.businessHome;
  if (role === 'customer') return AuthHref.customerHome;
  return AuthHref.roleSelect;
}

export function getTicketsListHref(): Href {
  return AuthHref.customerTickets;
}

/** Unauthenticated entry after splash / logout. */
export function getUnauthenticatedHref(): Href {
  return AuthHref.welcome;
}
