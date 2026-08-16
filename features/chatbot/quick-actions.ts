import type { TranslateFn } from '@/lib/i18n/locale-context';

export type ChatQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export type ChatQuickActionId =
  | 'find_service'
  | 'nearby'
  | 'active_queue'
  | 'tickets'
  | 'favorites'
  | 'how_it_works';

export function getChatQuickActions(t: TranslateFn): ChatQuickAction[] {
  return [
    {
      id: 'find_service',
      label: t('chatbot.quick.findService'),
      prompt: t('chatbot.prompts.findService'),
    },
    {
      id: 'nearby',
      label: t('chatbot.quick.nearby'),
      prompt: t('chatbot.prompts.nearby'),
    },
    {
      id: 'active_queue',
      label: t('chatbot.quick.activeQueue'),
      prompt: t('chatbot.prompts.activeQueue'),
    },
    {
      id: 'tickets',
      label: t('chatbot.quick.tickets'),
      prompt: t('chatbot.prompts.tickets'),
    },
    {
      id: 'favorites',
      label: t('chatbot.quick.favorites'),
      prompt: t('chatbot.prompts.favorites'),
    },
    {
      id: 'how_it_works',
      label: t('chatbot.quick.howItWorks'),
      prompt: t('chatbot.prompts.howItWorks'),
    },
  ];
}
