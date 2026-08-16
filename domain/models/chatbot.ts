import type { ReplyStyle } from '@/domain/models/reply-style';
import type { AppLanguage } from '@/types';

export type ChatRole = 'user' | 'assistant';

export type ChatbotLocation = {
  latitude: number;
  longitude: number;
};

/** Public business snippet returned from chatbot tools — never invented. */
export type ChatBusinessCard = {
  id: string;
  name: string;
  category: string;
  distanceKm: number | null;
  serviceId?: string | null;
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

export type ChatTicketCard = {
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

export type ChatFavoriteCard = {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
};

export type ChatHistoryCard = {
  id: string;
  organizationName: string;
  organizationId: string;
  serviceName: string;
  status: string;
  visitedAt: string;
};

export type ChatQueueStatusCard = {
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

export type ChatWaitingCustomerCard = {
  entryId: string;
  ticketNumber: string;
  serviceName: string;
  status: string;
  position: number;
};

export type ChatServiceInfoCard = {
  id: string;
  name: string;
  departmentName: string;
  price: number | null;
  isActive: boolean;
};

export type ChatStatsCard = {
  period: string;
  customers: number;
  served: number;
  skipped: number;
  cancelled: number;
  waiting: number;
};

export type ChatOwnerHistoryCard = {
  id: string;
  ticketNumber: string;
  serviceName: string;
  departmentName: string;
  status: string;
  visitedAt: string;
};

export type ChatPendingActionType =
  | 'join_queue'
  | 'cancel_ticket'
  | 'skip_customer'
  | 'close_queue';

export type ChatPendingActionStatus =
  | 'pending'
  | 'executing'
  | 'success'
  | 'error'
  | 'dismissed';

export type ChatPendingAction = {
  type: ChatPendingActionType;
  status: ChatPendingActionStatus;
  organizationId: string;
  organizationName: string;
  serviceId: string | null;
  serviceName: string;
  ticketId: string | null;
  ticketNumber: string | null;
  entryId?: string | null;
  queueId?: string | null;
  waitingCount: number | null;
  estimatedWaitMinutes: number | null;
  queueStatus: string | null;
  labels: {
    confirm: string;
    dismiss: string;
  };
  errorMessage?: string;
};

export type ChatbotConfirmedAction =
  | { name: 'joinQueue'; organizationId: string; serviceId: string }
  | { name: 'cancelTicket'; ticketId: string }
  | { name: 'skipCustomer'; entryId: string }
  | { name: 'closeQueue'; queueId: string };

export type ChatbotActionResult = {
  ok: boolean;
  code?: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  cards?: ChatBusinessCard[];
  ticket?: ChatTicketCard | null;
  favorites?: ChatFavoriteCard[];
  history?: ChatHistoryCard[];
  queueStatus?: ChatQueueStatusCard[];
  waiting?: ChatWaitingCustomerCard[];
  services?: ChatServiceInfoCard[];
  stats?: ChatStatsCard;
  ownerHistory?: ChatOwnerHistoryCard[];
  pendingAction?: ChatPendingAction | null;
  replyStyle?: ReplyStyle;
  error?: boolean;
  retryable?: boolean;
  errorCode?: string;
  locationRequired?: boolean;
};

export type ChatbotConversationTurn = {
  role: ChatRole;
  content: string;
};

export type ChatbotSendInput = {
  messages: ChatbotConversationTurn[];
  language: AppLanguage;
  location?: ChatbotLocation | null;
  confirmedAction?: ChatbotConfirmedAction;
  /** Stable id for one user send. Prevents duplicate Gemini calls on client retries. */
  clientRequestId?: string;
};

export type ChatbotSendResult = {
  message: string;
  cards?: ChatBusinessCard[];
  ticket?: ChatTicketCard | null;
  favorites?: ChatFavoriteCard[];
  history?: ChatHistoryCard[];
  queueStatus?: ChatQueueStatusCard[];
  waiting?: ChatWaitingCustomerCard[];
  services?: ChatServiceInfoCard[];
  stats?: ChatStatsCard;
  ownerHistory?: ChatOwnerHistoryCard[];
  pendingAction?: ChatPendingAction | null;
  actionResult?: ChatbotActionResult;
  locationRequired?: boolean;
};

export type ChatSpeakable = {
  messageId: string;
  text: string;
  replyStyle: ReplyStyle;
};

export type ChatbotConfirmActionInput = {
  messages: ChatbotConversationTurn[];
  language: AppLanguage;
  location?: ChatbotLocation | null;
  action: ChatbotConfirmedAction;
};
