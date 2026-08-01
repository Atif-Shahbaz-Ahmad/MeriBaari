import { create } from 'zustand';

import { StorageKeys } from '@/constants/config';
import { secureStorage } from '@/lib/secure-store';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  isHydrated: false,

  hydrate: async () => {
    const value = await secureStorage.getItem(StorageKeys.themePreference);
    if (value === 'light' || value === 'dark' || value === 'system') {
      set({ preference: value, isHydrated: true });
      return;
    }
    set({ isHydrated: true });
  },

  setPreference: async (preference) => {
    await secureStorage.setItem(StorageKeys.themePreference, preference);
    set({ preference });
  },
}));
