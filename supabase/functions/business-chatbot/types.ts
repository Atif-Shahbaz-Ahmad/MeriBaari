import type { ReplyStyle } from '../_shared/chatbot/reply-style.ts';

export type ChatLanguage = 'en' | 'ur';
export type { ReplyStyle };

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type QueueStatusCard = {
  queueId: string;
  queueName: string;
  departmentName: string;
  serviceName: string;
  status: string;
  waitingCount: number;
  currentlyServing: string | null;
  nextCustomer: string | null;
  estimatedWaitMinutes: number | null;
};

export type WaitingCustomerCard = {
  entryId: string;
  ticketNumber: string;
  serviceName: string;
  status: string;
  position: number;
};

export type ServiceInfoCard = {
  id: string;
  name: string;
  departmentName: string;
  price: number | null;
  isActive: boolean;
};

export type StatsCard = {
  period: string;
  customers: number;
  served: number;
  skipped: number;
  cancelled: number;
  waiting: number;
};

export type HistoryCard = {
  id: string;
  ticketNumber: string;
  serviceName: string;
  departmentName: string;
  status: string;
  visitedAt: string;
};

export type PendingActionType = 'skip_customer' | 'close_queue';

export type PendingActionLabels = {
  confirm: string;
  dismiss: string;
};

export type PendingAction = {
  type: PendingActionType;
  organizationId: string;
  organizationName: string;
  serviceId: string | null;
  serviceName: string;
  ticketId: string | null;
  ticketNumber: string | null;
  entryId: string | null;
  queueId: string | null;
  waitingCount: number | null;
  estimatedWaitMinutes: number | null;
  queueStatus: string | null;
  labels: PendingActionLabels;
};

export type ConfirmedAction =
  | { name: 'skipCustomer'; entryId: string }
  | { name: 'closeQueue'; queueId: string };

export type ActionResult = {
  ok: boolean;
  code?: string;
};

export type UiPayload = {
  queueStatus?: QueueStatusCard[];
  waiting?: WaitingCustomerCard[];
  services?: ServiceInfoCard[];
  stats?: StatsCard;
  history?: HistoryCard[];
  pendingAction?: PendingAction | null;
  actionResult?: ActionResult;
};

export type OwnedOrganization = {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  workingHours: string;
  phone: string | null;
  isActive: boolean;
  status: string;
  subscriptionStatus: string;
  approvedAt: string | null;
  paymentRejectionReason: string | null;
  adminHidden: boolean;
};

export type ToolContext = {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  userId: string;
  org: OwnedOrganization | null;
  ui: UiPayload;
  replyStyle: ReplyStyle;
};

export const MAX_RESULTS = 12;
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ACTIVE_ENTRY_STATUSES = ['waiting', 'called', 'serving'] as const;
export const HISTORY_TICKET_STATUSES = ['served', 'cancelled', 'skipped'] as const;
