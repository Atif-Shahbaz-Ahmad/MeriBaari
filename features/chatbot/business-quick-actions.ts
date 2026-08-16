import type { TranslateFn } from '@/lib/i18n/locale-context';

export type BusinessChatQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export function getBusinessChatQuickActions(t: TranslateFn): BusinessChatQuickAction[] {
  return [
    {
      id: 'queue_status',
      label: t('businessChatbot.quick.queueStatus'),
      prompt: t('businessChatbot.prompts.queueStatus'),
    },
    {
      id: 'call_next',
      label: t('businessChatbot.quick.callNext'),
      prompt: t('businessChatbot.prompts.callNext'),
    },
    {
      id: 'today',
      label: t('businessChatbot.quick.today'),
      prompt: t('businessChatbot.prompts.today'),
    },
    {
      id: 'waiting',
      label: t('businessChatbot.quick.waiting'),
      prompt: t('businessChatbot.prompts.waiting'),
    },
    {
      id: 'services',
      label: t('businessChatbot.quick.services'),
      prompt: t('businessChatbot.prompts.services'),
    },
    {
      id: 'stats',
      label: t('businessChatbot.quick.stats'),
      prompt: t('businessChatbot.prompts.stats'),
    },
  ];
}
