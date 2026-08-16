import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import {
  CHATBOT_MAX_CONTEXT_TURNS,
  CHATBOT_MAX_INPUT_LENGTH,
} from '@/domain/services/chatbot.service';
import {
  ChatbotError,
  getChatbotErrorMessage,
  isChatbotErrorRetryable,
  toChatbotError,
} from '@/domain/errors/chatbot-error';
import type {
  ChatMessage,
  ChatPendingAction,
  ChatSpeakable,
  ChatbotConfirmedAction,
  ChatbotSendResult,
} from '@/domain/models/chatbot';
import { toChatSpeakable } from '@/features/chatbot/speakable';
import { notificationQueryKeys } from '@/features/notifications/query-keys';
import { historyQueryKeys } from '@/features/history/query-keys';
import { ticketQueryKeys, queueQueryKeys } from '@/features/queue/query-keys';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessChatStore } from '@/store/business-chat-store';

const SEND_COOLDOWN_MS = 800;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newClientRequestId(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toConfirmedAction(action: ChatPendingAction): ChatbotConfirmedAction | null {
  if (action.type === 'skip_customer') {
    if (!action.entryId) return null;
    return { name: 'skipCustomer', entryId: action.entryId };
  }
  if (action.type === 'close_queue') {
    if (!action.queueId) return null;
    return { name: 'closeQueue', queueId: action.queueId };
  }
  return null;
}

export function useBusinessChat() {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.role);
  const messages = useBusinessChatStore((s) => s.messages);
  const setUserId = useBusinessChatStore((s) => s.setUserId);
  const append = useBusinessChatStore((s) => s.append);
  const replaceLast = useBusinessChatStore((s) => s.replaceLast);
  const updateLast = useBusinessChatStore((s) => s.updateLast);
  const updateById = useBusinessChatStore((s) => s.updateById);
  const clearStore = useBusinessChatStore((s) => s.clear);

  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState('');
  const lastSentAt = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    setUserId(userId ?? null);
  }, [userId, setUserId]);

  const canSend = role === 'business' && Boolean(userId);

  const conversationTurns = useCallback(() => {
    return [...useBusinessChatStore.getState().messages]
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.error))
      .slice(-CHATBOT_MAX_CONTEXT_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));
  }, []);

  const friendlyError = useCallback(
    (error: unknown): { content: string; code: ChatbotError['code']; retryable: boolean } => {
      const mapped = toChatbotError(error);
      const copy = t(`businessChatbot.errors.${mapped.code}`);
      return {
        content: copy && !copy.startsWith('businessChatbot.') ? copy : getChatbotErrorMessage(mapped),
        code: mapped.code,
        retryable: mapped.retryable && isChatbotErrorRetryable(mapped.code),
      };
    },
    [t],
  );

  const requestAssistant = useCallback(
    async (clientRequestId?: string) => {
      const history = conversationTurns();
      return getContainer().businessChatbotService.send({
        messages: history,
        language,
        clientRequestId,
      });
    },
    [conversationTurns, language],
  );

  const refreshBusinessData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: historyQueryKeys.all });
  }, [queryClient]);

  const sendText = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || !canSend) return;
      if (content.length > CHATBOT_MAX_INPUT_LENGTH) return;
      if (inFlight.current) return;
      if (Date.now() - lastSentAt.current < SEND_COOLDOWN_MS) return;

      inFlight.current = true;
      lastSentAt.current = Date.now();
      setIsSending(true);
      setDraft('');
      append({
        id: newId(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      });

      try {
        const result = await requestAssistant(newClientRequestId());
        const id = newId();
        const spoken = toChatSpeakable(result, id, content);
        append(successMessage(result, id, spoken.replyStyle));
        if (result.actionResult || result.queueStatus || result.waiting) {
          refreshBusinessData();
        }
        return spoken;
      } catch (error) {
        const mapped = friendlyError(error);
        append({
          id: newId(),
          role: 'assistant',
          content: mapped.content,
          createdAt: new Date().toISOString(),
          error: true,
          retryable: mapped.retryable,
          errorCode: mapped.code,
        });
      } finally {
        inFlight.current = false;
        setIsSending(false);
      }
    },
    [append, canSend, friendlyError, refreshBusinessData, requestAssistant],
  );

  const retryLast = useCallback(async () => {
    if (!canSend || inFlight.current) return;
    const current = useBusinessChatStore.getState().messages;
    const last = current[current.length - 1];
    if (!last?.error || last.retryable === false) return;
    const hasUser = current.some((m) => m.role === 'user');
    if (!hasUser) return;

    inFlight.current = true;
    lastSentAt.current = Date.now();
    setIsSending(true);

    try {
      const result = await requestAssistant(newClientRequestId());
      const lastUser = [...current].reverse().find((m) => m.role === 'user');
      const spoken = toChatSpeakable(result, last.id, lastUser?.content ?? '');
      replaceLast(successMessage(result, last.id, spoken.replyStyle));
      if (result.actionResult || result.queueStatus || result.waiting) {
        refreshBusinessData();
      }
      return spoken;
    } catch (error) {
      const mapped = friendlyError(error);
      updateLast({
        content: mapped.content,
        error: true,
        retryable: mapped.retryable,
        errorCode: mapped.code,
      });
    } finally {
      inFlight.current = false;
      setIsSending(false);
    }
  }, [canSend, friendlyError, refreshBusinessData, replaceLast, requestAssistant, updateLast]);

  const confirmPendingAction = useCallback(
    async (messageId: string) => {
      if (!canSend || inFlight.current) return;
      const current = useBusinessChatStore.getState().messages;
      const target = current.find((item) => item.id === messageId);
      const pending = target?.pendingAction;
      if (!pending || pending.status === 'executing' || pending.status === 'success') {
        return;
      }
      if (pending.status === 'dismissed') return;

      const action = toConfirmedAction(pending);
      if (!action) return;

      inFlight.current = true;
      setIsSending(true);
      updateById(messageId, {
        pendingAction: { ...pending, status: 'executing', errorMessage: undefined },
      });

      try {
        const result = await getContainer().businessChatbotService.confirmAction({
          messages: conversationTurns(),
          language,
          action,
        });
        const ok = result.actionResult?.ok === true;
        const nextStatus: ChatPendingAction['status'] = ok ? 'success' : 'error';
        updateById(messageId, {
          content: nextStatus === 'success' ? result.message : target?.content,
          pendingAction: {
            ...pending,
            status: nextStatus,
            errorMessage: nextStatus === 'error' ? result.message : undefined,
          },
        });
        if (ok) {
          refreshBusinessData();
        }
      } catch (error) {
        const mapped = friendlyError(error);
        updateById(messageId, {
          pendingAction: {
            ...pending,
            status: 'error',
            errorMessage: mapped.content,
          },
        });
      } finally {
        inFlight.current = false;
        setIsSending(false);
      }
    },
    [
      canSend,
      conversationTurns,
      friendlyError,
      language,
      refreshBusinessData,
      updateById,
    ],
  );

  const dismissPendingAction = useCallback(
    (messageId: string) => {
      if (inFlight.current) return;
      const current = useBusinessChatStore.getState().messages;
      const target = current.find((item) => item.id === messageId);
      const pending = target?.pendingAction;
      if (!pending || pending.status === 'executing' || pending.status === 'success') {
        return;
      }
      updateById(messageId, {
        pendingAction: { ...pending, status: 'dismissed' },
      });
    },
    [updateById],
  );

  const clearConversation = useCallback(() => {
    if (inFlight.current) return;
    clearStore();
    setDraft('');
  }, [clearStore]);

  const remaining = useMemo(
    () => CHATBOT_MAX_INPUT_LENGTH - draft.length,
    [draft.length],
  );

  return {
    messages,
    draft,
    setDraft,
    isSending,
    canSend,
    remaining,
    maxLength: CHATBOT_MAX_INPUT_LENGTH,
    sendDraft: () => {
      if (inFlight.current || isSending) return Promise.resolve(undefined);
      return sendText(draft);
    },
    sendText,
    retryLast,
    clearConversation,
    confirmPendingAction,
    dismissPendingAction,
  };
}

function successMessage(
  result: ChatbotSendResult,
  id = newId(),
  replyStyle?: ChatSpeakable['replyStyle'],
): ChatMessage {
  return {
    id,
    role: 'assistant',
    content: result.message,
    createdAt: new Date().toISOString(),
    queueStatus: result.queueStatus,
    waiting: result.waiting,
    services: result.services,
    stats: result.stats,
    ownerHistory: result.ownerHistory,
    pendingAction: result.pendingAction ?? null,
    replyStyle,
  };
}
