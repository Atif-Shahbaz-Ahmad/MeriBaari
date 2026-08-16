import type { ReplyStyle } from './reply-style.ts';

export type ChatLanguage = 'en' | 'ur';
export type { ReplyStyle };

export type ChatLocation = {
  latitude: number;
  longitude: number;
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type BusinessCard = {
  id: string;
  name: string;
  category: string;
  distanceKm: number | null;
  serviceId: string | null;
  serviceName: string | null;
  price: number | null;
  address: string;
  city: string;
  isOpen: boolean;
  workingHours: string | null;
  averageWaitMinutes: number | null;
  rating: number | null;
  reviewCount: number;
};

export type PendingActionType = 'join_queue' | 'cancel_ticket';

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
  waitingCount: number | null;
  estimatedWaitMinutes: number | null;
  queueStatus: string | null;
  labels: PendingActionLabels;
};

export type ConfirmedAction =
  | { name: 'joinQueue'; organizationId: string; serviceId: string }
  | { name: 'cancelTicket'; ticketId: string };

export type ActionResult = {
  ok: boolean;
  code?: string;
};

export type TicketCard = {
  id: string;
  ticketNumber: string;
  organizationName: string;
  organizationId: string;
  serviceName: string;
  departmentName: string;
  status: string;
  position: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  currentServing: string;
  queueStatus: string | null;
};

export type FavoriteCard = {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
};

export type HistoryCard = {
  id: string;
  organizationName: string;
  organizationId: string;
  serviceName: string;
  status: string;
  visitedAt: string;
};

export type UiPayload = {
  cards?: BusinessCard[];
  ticket?: TicketCard | null;
  favorites?: FavoriteCard[];
  history?: HistoryCard[];
  locationRequired?: boolean;
  pendingAction?: PendingAction | null;
  actionResult?: ActionResult;
};

export type ToolContext = {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  userId: string;
  location: ChatLocation | null;
  ui: UiPayload;
  replyStyle: ReplyStyle;
};

export const MAX_RESULTS = 6;
export const ACTIVE_TICKET_STATUSES = ['waiting', 'called', 'serving'] as const;
export const CANCELLABLE_TICKET_STATUSES = ['waiting', 'called'] as const;
export const HISTORY_TICKET_STATUSES = ['served', 'cancelled', 'skipped'] as const;
export const PUBLIC_ORG_STATUS = 'active';
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
