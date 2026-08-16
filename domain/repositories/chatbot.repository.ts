import type {
  ChatbotConfirmActionInput,
  ChatbotSendInput,
  ChatbotSendResult,
} from '@/domain/models/chatbot';

export interface ChatbotRepository {
  send(input: ChatbotSendInput): Promise<ChatbotSendResult>;
  confirmAction(input: ChatbotConfirmActionInput): Promise<ChatbotSendResult>;
}
