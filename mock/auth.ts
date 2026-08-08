import type { AuthSession, AuthUser, UserRole } from '@/types';

/** Demo users used only when Supabase env vars are unset (MockAuthRepository). */
export const MOCK_AUTH_USERS: Record<string, AuthUser> = {
  customer: {
    id: 'demo-customer-1',
    fullName: 'Atif Khan',
    email: 'atif@meribaari.app',
    phone: '+92 300 1234567',
    role: 'customer',
  },
  business: {
    id: 'demo-business-1',
    fullName: 'City Hospital Admin',
    email: 'ops@cityhospital.pk',
    phone: '+92 300 7654321',
    role: 'business',
  },
};

export function createMockSession(
  role: UserRole | null = null,
  overrides?: Partial<AuthUser>,
): AuthSession {
  const base =
    role === 'business' ? MOCK_AUTH_USERS.business : MOCK_AUTH_USERS.customer;

  return {
    accessToken: `demo_${Date.now()}`,
    method: 'demo',
    user: {
      ...base,
      role,
      ...overrides,
    },
  };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  business: 'Business Owner',
};

export const ROLE_CARD_COPY: Record<
  UserRole,
  { title: string; description: string; bullets: string[] }
> = {
  customer: {
    title: 'Customer',
    description: 'Join queues and track your turn without waiting in line.',
    bullets: ['Join queues', 'Track waiting time', 'Receive notifications'],
  },
  business: {
    title: 'Business',
    description: 'Run digital queues and serve customers more efficiently.',
    bullets: ['Manage queues', 'Call customers', 'Monitor operations'],
  },
};
