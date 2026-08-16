import { create } from 'zustand';

import type { ChatMessage, ChatPendingAction } from '@/domain/models/chatbot';

interface CustomerChatState {
  userId: string | null;
  messages: ChatMessage[];
  setUserId: (userId: string | null) => void;
  append: (message: ChatMessage) => void;
  replaceLast: (message: ChatMessage) => void;
  updateLast: (patch: Partial<ChatMessage>) => void;
  updateById: (id: string, patch: Partial<ChatMessage>) => void;
  dismissPendingActions: (exceptId?: string) => void;
  clear: () => void;
}

function dismissAction(action: ChatPendingAction | null | undefined): ChatPendingAction | null {
  if (!action || action.status === 'success' || action.status === 'dismissed') {
    return action ?? null;
  }
  if (action.status === 'executing') return action;
  return { ...action, status: 'dismissed' };
}

export const useCustomerChatStore = create<CustomerChatState>((set, get) => ({
  userId: null,
  messages: [],

  setUserId: (userId) => {
    if (get().userId === userId) return;
    set({ userId, messages: [] });
  },

  append: (message) => {
    const current = get().messages;
    const dismissed =
      message.role === 'user'
        ? current.map((item) => ({
            ...item,
            pendingAction: dismissAction(item.pendingAction),
          }))
        : current;
    set({ messages: [...dismissed, message] });
  },

  replaceLast: (message) => {
    const current = get().messages;
    if (current.length === 0) {
      set({ messages: [message] });
      return;
    }
    set({ messages: [...current.slice(0, -1), message] });
  },

  updateLast: (patch) => {
    const current = get().messages;
    const last = current[current.length - 1];
    if (!last) return;
    set({ messages: [...current.slice(0, -1), { ...last, ...patch }] });
  },

  updateById: (id, patch) => {
    set({
      messages: get().messages.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  },

  dismissPendingActions: (exceptId) => {
    set({
      messages: get().messages.map((item) => {
        if (exceptId && item.id === exceptId) return item;
        return { ...item, pendingAction: dismissAction(item.pendingAction) };
      }),
    });
  },

  clear: () => set({ messages: [] }),
}));
