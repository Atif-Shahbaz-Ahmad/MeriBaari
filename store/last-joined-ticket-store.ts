import { create } from 'zustand';

/** Lightweight client-only state for join success navigation. */
interface LastJoinedTicketState {
  lastJoinedTicketId: string | null;
  setLastJoinedTicketId: (id: string | null) => void;
  clearLastJoined: () => void;
}

export const useLastJoinedTicketStore = create<LastJoinedTicketState>((set) => ({
  lastJoinedTicketId: null,
  setLastJoinedTicketId: (id) => set({ lastJoinedTicketId: id }),
  clearLastJoined: () => set({ lastJoinedTicketId: null }),
}));
