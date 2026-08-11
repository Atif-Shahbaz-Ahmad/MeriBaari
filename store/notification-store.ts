/**
 * Lightweight UI helpers only — notification server state lives in React Query.
 * Kept for backward compatibility with any remaining callers.
 */
import { create } from 'zustand';

interface NotificationUiState {
  /** Optional last-seen toast id for future in-app banners. */
  lastIncomingId: string | null;
  setLastIncomingId: (id: string | null) => void;
}

export const useNotificationStore = create<NotificationUiState>((set) => ({
  lastIncomingId: null,
  setLastIncomingId: (id) => set({ lastIncomingId: id }),
}));
