import type {
  BusinessDashboardStats,
  BusinessOrganizationSummary,
  BusinessQuickAction,
} from '@/types';

export const MOCK_BUSINESS_ORG: BusinessOrganizationSummary = {
  id: 'org-city-hospital',
  name: 'City Hospital',
  logoInitials: 'CH',
  categoryLabel: 'Hospital',
  location: 'Gulberg, Lahore',
};

export const MOCK_BUSINESS_DASHBOARD_STATS: BusinessDashboardStats = {
  todaysCustomers: 186,
  customersWaiting: 27,
  customersServed: 142,
  averageWaitingMinutes: 14,
};

export const MOCK_BUSINESS_QUICK_ACTIONS: BusinessQuickAction[] = [
  { id: 'call_next', label: 'Call Next' },
  { id: 'walk_in', label: 'Add Walk-in' },
  { id: 'pause', label: 'Pause Queue' },
  { id: 'resume', label: 'Resume Queue' },
];

export function getBusinessGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatBusinessDate(date = new Date()): string {
  return date.toLocaleDateString('en-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
