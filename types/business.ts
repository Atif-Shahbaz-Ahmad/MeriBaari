/** Business queue operational status — independent of customer ticket status. */
export type BusinessQueueStatus = 'active' | 'paused' | 'closed';

/** Priority is a placeholder until Supabase priority rules exist. */
export type BusinessPriority = 'normal' | 'priority' | 'urgent';

export type BusinessActivityType =
  | 'called'
  | 'skipped'
  | 'completed'
  | 'cancelled'
  | 'recalled'
  | 'paused'
  | 'resumed'
  | 'walk_in';

export interface BusinessOrganizationSummary {
  id: string;
  name: string;
  logoInitials: string;
  categoryLabel: string;
  location: string;
}

export interface BusinessDashboardStats {
  todaysCustomers: number;
  customersWaiting: number;
  customersServed: number;
  averageWaitingMinutes: number;
}

export interface BusinessQueue {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  serviceId: string;
  serviceName: string;
  status: BusinessQueueStatus;
  currentServing: string;
  nextNumber: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
  averageWaitMinutes: number;
  prefix: string;
}

export interface BusinessQueueDetailsStats {
  queueId: string;
  totalWaiting: number;
  completedToday: number;
  cancelledToday: number;
  averageServiceMinutes: number;
  /** Tickets served per hour */
  queueSpeed: number;
}

export interface BusinessWaitingCustomer {
  id: string;
  queueId: string;
  queueNumber: string;
  customerName: string;
  phone?: string;
  joinedAt: string;
  estimatedServiceMinutes: number;
  priority: BusinessPriority;
  status: 'waiting' | 'called' | 'serving' | 'skipped';
}

export interface BusinessActivityItem {
  id: string;
  queueId?: string;
  queueName?: string;
  type: BusinessActivityType;
  title: string;
  subtitle: string;
  ticketNumber?: string;
  timestamp: string;
}

export interface WalkInDraft {
  customerName: string;
  phone: string;
  serviceId: string;
  departmentId: string;
  priority: BusinessPriority;
}

export interface WalkInResult {
  ticketNumber: string;
  queueId: string;
  queueName: string;
  departmentName: string;
  serviceName: string;
  estimatedWaitMinutes: number;
  position: number;
}

export interface BusinessQuickAction {
  id: 'call_next' | 'walk_in' | 'pause' | 'resume';
  label: string;
}
