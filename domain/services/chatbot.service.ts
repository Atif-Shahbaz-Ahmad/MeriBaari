import type {
  ChatbotConfirmActionInput,
  ChatbotSendInput,
  ChatbotSendResult,
} from '@/domain/models/chatbot';
import type { ChatbotRepository } from '@/domain/repositories/chatbot.repository';
import { ChatbotError } from '@/domain/errors/chatbot-error';

export const CHATBOT_MAX_INPUT_LENGTH = 500;
export const CHATBOT_MAX_CONTEXT_TURNS = 12;
/** Must stay above the Edge Function deadline (50s) and below platform kill (~60–150s). */
export const CHATBOT_REQUEST_TIMEOUT_MS = 55_000;
export const CHATBOT_MAX_TRANSIENT_ATTEMPTS = 3;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ChatbotService {
  constructor(private readonly chatbot: ChatbotRepository) {}

  async send(input: ChatbotSendInput): Promise<ChatbotSendResult> {
    const messages = (input.messages ?? [])
      .map((turn) => ({
        role: turn.role,
        content: turn.content.trim(),
      }))
      .filter((turn) => turn.content.length > 0)
      .slice(-CHATBOT_MAX_CONTEXT_TURNS);

    if (messages.length === 0) {
      throw new ChatbotError('invalid_data', 'Please enter a message.');
    }

    const last = messages[messages.length - 1];
    if (last.role !== 'user') {
      throw new ChatbotError('invalid_data', 'Please enter a message.');
    }
    if (last.content.length > CHATBOT_MAX_INPUT_LENGTH) {
      throw new ChatbotError(
        'invalid_data',
        `Please keep messages under ${CHATBOT_MAX_INPUT_LENGTH} characters.`,
      );
    }

    return this.chatbot.send({
      messages,
      // App UI language only. The Edge Function mirrors the latest user message
      // (English / Urdu script / Roman Urdu) and does not use this for replies.
      language: input.language === 'ur' ? 'ur' : 'en',
      location: normalizeLocation(input.location),
      clientRequestId: normalizeClientRequestId(input.clientRequestId),
    });
  }

  async confirmAction(input: ChatbotConfirmActionInput): Promise<ChatbotSendResult> {
    const action = normalizeConfirmedAction(input.action);
    if (!action) {
      throw new ChatbotError('invalid_data', 'Please confirm the action again.');
    }

    const messages = (input.messages ?? [])
      .map((turn) => ({
        role: turn.role,
        content: turn.content.trim(),
      }))
      .filter((turn) => turn.content.length > 0)
      .slice(-CHATBOT_MAX_CONTEXT_TURNS);

    return this.chatbot.confirmAction({
      messages,
      language: input.language === 'ur' ? 'ur' : 'en',
      location: normalizeLocation(input.location),
      action,
    });
  }
}

function normalizeLocation(
  location: ChatbotSendInput['location'],
): ChatbotSendInput['location'] {
  return location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
    ? location
    : null;
}

function normalizeConfirmedAction(
  action: ChatbotConfirmActionInput['action'] | undefined,
): ChatbotConfirmActionInput['action'] | null {
  if (!action || typeof action !== 'object') return null;
  if (action.name === 'joinQueue') {
    if (!UUID_RE.test(action.organizationId) || !UUID_RE.test(action.serviceId)) {
      return null;
    }
    return {
      name: 'joinQueue',
      organizationId: action.organizationId,
      serviceId: action.serviceId,
    };
  }
  if (action.name === 'cancelTicket') {
    if (!UUID_RE.test(action.ticketId)) return null;
    return { name: 'cancelTicket', ticketId: action.ticketId };
  }
  if (action.name === 'skipCustomer') {
    if (!UUID_RE.test(action.entryId)) return null;
    return { name: 'skipCustomer', entryId: action.entryId };
  }
  if (action.name === 'closeQueue') {
    if (!UUID_RE.test(action.queueId)) return null;
    return { name: 'closeQueue', queueId: action.queueId };
  }
  return null;
}

function normalizeClientRequestId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  return /^[A-Za-z0-9._-]{8,80}$/.test(value) ? value : undefined;
}
