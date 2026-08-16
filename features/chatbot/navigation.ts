import { router, type Href } from 'expo-router';

export const ChatbotHref = {
  assistant: '/assistant' as Href,
  businessAssistant: '/(business)/assistant' as Href,
};

export function pushCustomerAssistant() {
  router.push(ChatbotHref.assistant);
}

export function pushBusinessAssistant() {
  router.push(ChatbotHref.businessAssistant);
}
