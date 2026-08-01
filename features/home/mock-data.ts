import type { ActivityItem, NearbyService, QueueTicket, QuickAction } from '@/types';

export const mockCurrentTicket: QueueTicket = {
  id: 'ticket-1',
  ticketNumber: 'A-127',
  locationName: 'City Hospital',
  serviceName: 'General OPD',
  status: 'waiting',
  position: 3,
  peopleAhead: 3,
  estimatedWaitMinutes: 12,
  currentServing: 'A-124',
  counter: '03',
  joinedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
};

export const mockProgressSequence = ['A-123', 'A-124', 'A-125', 'A-126', 'A-127'];

export const mockNearbyServices: NearbyService[] = [
  {
    id: 'svc-1',
    name: 'City Hospital',
    category: 'Healthcare',
    icon: 'hospital',
    averageWaitMinutes: 25,
    distanceKm: 1.2,
  },
  {
    id: 'svc-2',
    name: 'HBL Branch',
    category: 'Banking',
    icon: 'bank',
    averageWaitMinutes: 18,
    distanceKm: 0.8,
  },
  {
    id: 'svc-3',
    name: 'NADRA Center',
    category: 'Government',
    icon: 'id-card',
    averageWaitMinutes: 42,
    distanceKm: 2.4,
  },
  {
    id: 'svc-4',
    name: 'Passport Office',
    category: 'Government',
    icon: 'passport',
    averageWaitMinutes: 55,
    distanceKm: 3.1,
  },
];

export const mockRecentActivity: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Joined General OPD',
    subtitle: 'City Hospital · Ticket A-127',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    type: 'joined',
  },
  {
    id: 'act-2',
    title: 'Queue completed',
    subtitle: 'HBL Branch · Ticket B-044',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    type: 'completed',
  },
  {
    id: 'act-3',
    title: 'Turn reminder',
    subtitle: 'You are 2 positions away',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    type: 'reminder',
  },
];

export const mockQuickActions: QuickAction[] = [
  { id: 'qa-1', label: 'Scan QR', icon: 'scan' },
  { id: 'qa-2', label: 'Find Places', icon: 'search' },
  { id: 'qa-3', label: 'History', icon: 'history' },
  { id: 'qa-4', label: 'Favorites', icon: 'favorites' },
];

export const mockNotifications = [
  {
    id: 'n1',
    title: 'Your turn is coming up',
    body: 'Ticket A-127 — about 2 people ahead at City Hospital.',
    time: '10 min ago',
    group: 'Today' as const,
    type: 'reminder' as const,
  },
  {
    id: 'n2',
    title: 'Joined queue successfully',
    body: 'You joined General OPD. Ticket A-127.',
    time: '18 min ago',
    group: 'Today' as const,
    type: 'joined' as const,
  },
  {
    id: 'n3',
    title: 'Queue completed',
    body: 'Thanks for visiting HBL Branch.',
    time: 'Yesterday',
    group: 'Yesterday' as const,
    type: 'completed' as const,
  },
];

export const mockProfileStats = {
  queuesJoined: 28,
  timeSavedHours: 18,
  favoritePlaces: 5,
};
