export type QueueStatus =
  | 'waiting'
  | 'almost'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'called'
  | 'skipped'
  | 'served';

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  queueId: string;
  organizationId: string;
  /** Display name — kept as `locationName` for Home QueueCard compatibility */
  locationName: string;
  organizationName: string;
  departmentId: string;
  departmentName: string;
  serviceId: string;
  serviceName: string;
  status: QueueStatus;
  position: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  currentServing: string;
  counter?: string;
  joinedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  estimatedCompletionAt?: string;
  reminderEnabled: boolean;
  /** Actual wait once completed */
  actualWaitMinutes?: number;
  logoIcon?:
    | 'hospital'
    | 'bank'
    | 'building'
    | 'clinic'
    | 'university'
    | 'utensils'
    | 'landmark'
    | 'car';
  queueEntryId?: string;
  qrCode?: string;
  queueStatus?: 'open' | 'paused' | 'closed' | 'active';
}

export interface QueueTimelineEntry {
  ticketNumber: string;
  label?: string;
  isYou?: boolean;
  isServing?: boolean;
  isPast?: boolean;
}

export interface QueueProgressDetails {
  queueId: string;
  ticketId: string;
  capacity: number;
  currentPosition: number;
  peopleRemaining: number;
  averageServiceMinutes: number;
  estimatedFinishAt: string;
  currentServing: string;
  /** Tickets served per hour */
  queueSpeed: number;
  lastUpdatedAt: string;
  timeline: QueueTimelineEntry[];
}

export interface TicketStatistics {
  queuesJoined: number;
  hoursSaved: number;
  averageWaitingMinutes: number;
  favoriteOrganization: string;
}

export interface NearbyService {
  id: string;
  name: string;
  category: string;
  icon:
    | 'hospital'
    | 'bank'
    | 'building'
    | 'clinic'
    | 'university'
    | 'utensils'
    | 'landmark'
    | 'car';
  averageWaitMinutes: number;
  distanceKm?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type:
    | 'joined'
    | 'called'
    | 'serving'
    | 'completed'
    | 'skipped'
    | 'paused'
    | 'resumed'
    | 'closed'
    | 'reminder'
    | 'cancelled';
}

export interface QuickAction {
  id: string;
  label: string;
  icon: 'search' | 'history' | 'favorites';
}
