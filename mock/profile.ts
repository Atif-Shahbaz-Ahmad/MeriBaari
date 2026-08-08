import type { ProfileStats, UserRole } from '@/types';

import { MOCK_TICKET_STATISTICS } from './statistics';

export const MOCK_PROFILE_STATS: ProfileStats = {
  queuesJoined: MOCK_TICKET_STATISTICS.queuesJoined,
  hoursSaved: MOCK_TICKET_STATISTICS.hoursSaved,
  averageWaitingMinutes: MOCK_TICKET_STATISTICS.averageWaitingMinutes,
  favoriteOrganization: MOCK_TICKET_STATISTICS.favoriteOrganization,
  membershipSince: '2025-11-12T00:00:00.000Z',
};

/** Business-facing mock stats until org dashboard APIs exist. */
export const MOCK_BUSINESS_PROFILE_STATS = {
  activeQueues: 4,
  customersServedToday: 128,
  averageServiceMinutes: 6,
  organizationName: 'City Hospital',
  membershipSince: '2025-08-01T00:00:00.000Z',
};

export function getRoleDisplayLabel(role: UserRole | null | undefined): string {
  if (role === 'business') return 'Business Owner';
  if (role === 'customer') return 'Customer';
  return 'Not set';
}
