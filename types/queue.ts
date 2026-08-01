export type QueueStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled';

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  locationName: string;
  serviceName: string;
  status: QueueStatus;
  position: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  currentServing: string;
  counter?: string;
  joinedAt: string;
}

export interface NearbyService {
  id: string;
  name: string;
  category: string;
  icon: 'hospital' | 'bank' | 'id-card' | 'passport' | 'clinic' | 'pharmacy';
  averageWaitMinutes: number;
  distanceKm: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: 'joined' | 'completed' | 'reminder' | 'cancelled';
}

export interface QuickAction {
  id: string;
  label: string;
  icon: 'scan' | 'search' | 'history' | 'favorites';
}
