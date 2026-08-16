'use client';

import { useState } from 'react';

import type { ChatSpeakable } from '@/domain/models/chatbot';
import { useBusinessChat } from '@/features/chatbot/hooks/use-business-chat';
import { useTranslation } from '@/hooks/use-translation';
import { ChatWorkspace } from '@web/components/ChatWorkspace';

export default function BusinessAssistantPage() {
  const { t } = useTranslation();
  const chat = useBusinessChat();
  const [lastSpeakable, setLastSpeakable] = useState<ChatSpeakable | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t('businessChatbot.title')}</h1>
      <p className="text-ink-secondary">{t('businessChatbot.subtitle')}</p>
      <ChatWorkspace
        messages={chat.messages}
        draft={chat.draft}
        setDraft={chat.setDraft}
        isSending={chat.isSending}
        lastSpeakable={lastSpeakable}
        onSend={() => {
          void chat.sendDraft().then((spoken) => {
            if (spoken) setLastSpeakable(spoken);
          });
        }}
        onConfirm={(id) => void chat.confirmPendingAction(id)}
        onDismiss={(id) => chat.dismissPendingAction(id)}
        onVoiceTranscript={(text) => {
          chat.setDraft(text);
          void chat.sendText(text).then((spoken) => {
            if (spoken) setLastSpeakable(spoken);
          });
        }}
      />
    </div>
  );
}
