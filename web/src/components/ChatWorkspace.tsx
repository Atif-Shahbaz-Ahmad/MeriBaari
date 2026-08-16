'use client';

import Link from 'next/link';

import type { ChatMessage, ChatSpeakable } from '@/domain/models/chatbot';
import { useTranslation } from '@/hooks/use-translation';
import { Button, Card } from '@web/components/ui';
import { VoiceBar } from '@web/components/VoiceBar';
import { cn } from '@web/lib/cn';

export function ChatWorkspace({
  messages,
  draft,
  setDraft,
  isSending,
  onSend,
  onConfirm,
  onDismiss,
  onVoiceTranscript,
  lastSpeakable,
}: {
  messages: ChatMessage[];
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  onSend: () => void;
  onConfirm: (messageId: string) => void;
  onDismiss: (messageId: string) => void;
  onVoiceTranscript: (text: string) => void;
  lastSpeakable: ChatSpeakable | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <Card>
            <h2 className="font-semibold">{t('chatbot.emptyTitle')}</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {t('chatbot.emptyDescription')}
            </p>
          </Card>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'max-w-2xl rounded-2xl px-4 py-3 text-sm',
              message.role === 'user'
                ? 'ml-auto bg-primary text-white'
                : 'border border-line bg-surface-card',
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.cards?.length ? (
              <ul className="mt-3 space-y-2">
                {message.cards.map((biz) => (
                  <li key={biz.id} className="rounded-xl border border-line p-3">
                    <p className="font-semibold">{biz.name}</p>
                    <p className="text-xs text-ink-secondary">
                      {biz.city} · {biz.category}
                    </p>
                    <Link
                      className="mt-2 inline-block text-xs underline"
                      href={`/customer/join/${biz.id}`}
                    >
                      {t('chatbot.viewBusiness')}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {message.ticket ? (
              <div className="mt-3 rounded-xl border border-line p-3">
                <p className="font-semibold">{message.ticket.ticketNumber}</p>
                <p className="text-xs text-ink-secondary">
                  {message.ticket.organizationName} · {message.ticket.status}
                </p>
              </div>
            ) : null}
            {message.pendingAction &&
            (message.pendingAction.status === 'pending' ||
              message.pendingAction.status === 'executing' ||
              message.pendingAction.status === 'error') ? (
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  disabled={isSending}
                  onClick={() => onConfirm(message.id)}
                >
                  {message.pendingAction.labels.confirm}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSending}
                  onClick={() => onDismiss(message.id)}
                >
                  {message.pendingAction.labels.dismiss}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <VoiceBar lastSpeakable={lastSpeakable} onTranscript={onVoiceTranscript} />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <input
          className="flex-1 rounded-xl border border-line bg-surface-input px-3 py-2.5"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('chatbot.placeholder')}
        />
        <Button type="submit" disabled={isSending || !draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
