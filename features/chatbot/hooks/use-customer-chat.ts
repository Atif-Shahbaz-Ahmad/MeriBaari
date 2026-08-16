import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import {
  CHATBOT_MAX_CONTEXT_TURNS,
  CHATBOT_MAX_INPUT_LENGTH,
} from '@/domain/services/chatbot.service';
import {
  ChatbotError,
  getChatbotErrorCopyKey,
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
import { useRequestPushPermissionAfterJoin } from '@/features/notifications/hooks/use-push-notifications';
import { ticketQueryKeys, queueQueryKeys } from '@/features/queue/query-keys';
import { useUserLocation } from '@/features/search/hooks/use-user-location';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { useCustomerChatStore } from '@/store/customer-chat-store';

const SEND_COOLDOWN_MS = 800;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newClientRequestId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toConfirmedAction(action: ChatPendingAction): ChatbotConfirmedAction | null {
  if (action.type === 'join_queue') {
    if (!action.organizationId || !action.serviceId) return null;
    return {
      name: 'joinQueue',
      organizationId: action.organizationId,
      serviceId: action.serviceId,
    };
  }
  if (action.type === 'cancel_ticket') {
    if (!action.ticketId) return null;
    return { name: 'cancelTicket', ticketId: action.ticketId };
  }
  return null;
}

export function useCustomerChat() {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const requestPushAfterJoin = useRequestPushPermissionAfterJoin();
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.role);
  const messages = useCustomerChatStore((s) => s.messages);
  const setUserId = useCustomerChatStore((s) => s.setUserId);
  const append = useCustomerChatStore((s) => s.append);
  const replaceLast = useCustomerChatStore((s) => s.replaceLast);
  const updateLast = useCustomerChatStore((s) => s.updateLast);
  const updateById = useCustomerChatStore((s) => s.updateById);
  const clearStore = useCustomerChatStore((s) => s.clear);
  const location = useUserLocation({ autoRequest: false });

  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState('');
  const lastSentAt = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    setUserId(userId ?? null);
  }, [userId, setUserId]);

  const canSend = role === 'customer' && Boolean(userId);

  const conversationTurns = useCallback(() => {
    return [...useCustomerChatStore.getState().messages]
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.error))
      .slice(-CHATBOT_MAX_CONTEXT_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));
  }, []);

  const friendlyError = useCallback(
    (error: unknown): { content: string; code: ChatbotError['code']; retryable: boolean } => {
      const mapped = toChatbotError(error);
      return {
        content: t(getChatbotErrorCopyKey(mapped.code)) || getChatbotErrorMessage(mapped),
        code: mapped.code,
        retryable: mapped.retryable && isChatbotErrorRetryable(mapped.code),
      };
    },
    [t],
  );

  const requestAssistant = useCallback(
    async (
      coordsOverride?: { latitude: number; longitude: number } | null,
      clientRequestId?: string,
    ) => {
      const history = conversationTurns();
      return getContainer().chatbotService.send({
        messages: history,
        language,
        location: coordsOverride ?? location.coords,
        clientRequestId,
      });
    },
    [conversationTurns, language, location.coords],
  );

  const refreshTickets = useCallback(
    (joined: boolean) => {
      void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      if (joined) {
        void requestPushAfterJoin();
      }
    },
    [queryClient, requestPushAfterJoin],
  );

  const sendText = useCallback(
    async (
      raw: string,
      coordsOverride?: { latitude: number; longitude: number } | null,
    ) => {
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
        const result = await requestAssistant(coordsOverride, newClientRequestId());
        const id = newId();
        const spoken = toChatSpeakable(result, id, content);
        append(successMessage(result, id, spoken.replyStyle));
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
    [append, canSend, friendlyError, requestAssistant],
  );

  const retryLast = useCallback(async () => {
    if (!canSend || inFlight.current) return;
    const current = useCustomerChatStore.getState().messages;
    const last = current[current.length - 1];
    if (!last?.error || last.retryable === false) return;
    const hasUser = current.some((m) => m.role === 'user');
    if (!hasUser) return;

    inFlight.current = true;
    lastSentAt.current = Date.now();
    setIsSending(true);

    try {
      const result = await requestAssistant(undefined, newClientRequestId());
      const lastUser = [...current].reverse().find((m) => m.role === 'user');
      const spoken = toChatSpeakable(result, last.id, lastUser?.content ?? '');
      replaceLast(successMessage(result, last.id, spoken.replyStyle));
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
  }, [canSend, friendlyError, replaceLast, requestAssistant, updateLast]);

  const requestLocationAndRetry = useCallback(async () => {
    if (!canSend || inFlight.current) return;
    inFlight.current = true;
    setIsSending(true);

    try {
      const coords = await location.request();
      if (!coords) return;

      const current = useCustomerChatStore.getState().messages;
      const last = current[current.length - 1];
      const hasUser = current.some((m) => m.role === 'user');
      if (!hasUser) return;

      lastSentAt.current = Date.now();
      const result = await requestAssistant(coords, newClientRequestId());
      const lastUser = [...current].reverse().find((m) => m.role === 'user');
      const id = last?.error ? last.id : newId();
      const spoken = toChatSpeakable(result, id, lastUser?.content ?? '');
      if (last?.error) {
        replaceLast(successMessage(result, last.id, spoken.replyStyle));
      } else {
        append(successMessage(result, id, spoken.replyStyle));
      }
      return spoken;
    } catch (error) {
      const current = useCustomerChatStore.getState().messages;
      const last = current[current.length - 1];
      const mapped = friendlyError(error);
      if (last?.error) {
        updateLast({
          content: mapped.content,
          error: true,
          retryable: mapped.retryable,
          errorCode: mapped.code,
        });
      } else {
        append({
          id: newId(),
          role: 'assistant',
          content: mapped.content,
          createdAt: new Date().toISOString(),
          error: true,
          retryable: mapped.retryable,
          errorCode: mapped.code,
        });
      }
    } finally {
      inFlight.current = false;
      setIsSending(false);
    }
  }, [
    append,
    canSend,
    friendlyError,
    location,
    replaceLast,
    requestAssistant,
    updateLast,
  ]);

  const confirmPendingAction = useCallback(
    async (messageId: string) => {
      if (!canSend || inFlight.current) return;
      const current = useCustomerChatStore.getState().messages;
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
        const result = await getContainer().chatbotService.confirmAction({
          messages: conversationTurns(),
          language,
          location: location.coords,
          action,
        });
        const ok = result.actionResult?.ok === true;
        const nextStatus: ChatPendingAction['status'] =
          ok || Boolean(result.ticket) ? 'success' : 'error';
        updateById(messageId, {
          content: nextStatus === 'success' ? result.message : target?.content,
          ticket: result.ticket ?? target?.ticket,
          pendingAction: {
            ...pending,
            status: nextStatus,
            errorMessage: nextStatus === 'error' ? result.message : undefined,
          },
        });
        if (ok || result.ticket) {
          refreshTickets(action.name === 'joinQueue' && result.actionResult?.ok === true);
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
      location.coords,
      refreshTickets,
      updateById,
    ],
  );

  const dismissPendingAction = useCallback(
    (messageId: string) => {
      if (inFlight.current) return;
      const current = useCustomerChatStore.getState().messages;
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
    location,
    requestLocationAndRetry,
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
    cards: result.cards,
    ticket: result.ticket,
    favorites: result.favorites,
    history: result.history,
    pendingAction: result.pendingAction ?? null,
    locationRequired: result.locationRequired,
    replyStyle,
  };
}
