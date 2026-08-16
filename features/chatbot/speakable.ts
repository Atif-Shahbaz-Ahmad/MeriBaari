import { detectReplyStyle } from '@/domain/models/reply-style';
import type { ChatSpeakable, ChatbotSendResult } from '@/domain/models/chatbot';

export function toChatSpeakable(
  result: ChatbotSendResult,
  messageId: string,
  userText: string,
): ChatSpeakable {
  return {
    messageId,
    text: result.message,
    replyStyle: detectReplyStyle(userText),
  };
}
