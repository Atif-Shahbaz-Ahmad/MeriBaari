import type {
  ChatbotConfirmActionInput,
  ChatbotSendInput,
  ChatbotSendResult,
} from '@/domain/models/chatbot';
import type { ChatbotRepository } from '@/domain/repositories/chatbot.repository';
import { ChatbotError } from '@/domain/errors/chatbot-error';

/**
 * Used when Supabase is not configured. Does not invent queue or business data.
 */
export class MockBusinessChatbotRepository implements ChatbotRepository {
  async send(_input: ChatbotSendInput): Promise<ChatbotSendResult> {
    throw new ChatbotError(
      'not_configured',
      'The assistant is not available in this environment.',
    );
  }

  async confirmAction(_input: ChatbotConfirmActionInput): Promise<ChatbotSendResult> {
    throw new ChatbotError(
      'not_configured',
      'The assistant is not available in this environment.',
    );
  }
}
