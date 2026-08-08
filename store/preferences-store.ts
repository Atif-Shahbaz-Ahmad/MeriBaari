import { create } from 'zustand';

import { StorageKeys } from '@/constants/config';
import { secureStorage } from '@/lib/secure-store';
import { dataAccess } from '@/data';
import type { AppLanguage, UserPreferences } from '@/types';

const DEFAULT_PREFERENCES = dataAccess.DEFAULT_PREFERENCES;

interface PreferencesState extends UserPreferences {
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => Promise<void>;
  toggle: (key: keyof UserPreferences) => Promise<void>;
}

async function persist(prefs: UserPreferences) {
  await secureStorage.setItem(StorageKeys.userPreferences, JSON.stringify(prefs));
}

function pickPrefs(state: PreferencesState): UserPreferences {
  return {
    language: state.language,
    pushEnabled: state.pushEnabled,
    queueUpdates: state.queueUpdates,
    reminders: state.reminders,
    systemAlerts: state.systemAlerts,
    promotions: state.promotions,
    soundEnabled: state.soundEnabled,
    vibrationEnabled: state.vibrationEnabled,
    reduceMotion: state.reduceMotion,
    largerText: state.largerText,
    highContrast: state.highContrast,
    autoJoinFavorites: state.autoJoinFavorites,
    showEstimatedWait: state.showEstimatedWait,
    shareAnalytics: state.shareAnalytics,
  };
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...DEFAULT_PREFERENCES,
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await secureStorage.getItem(StorageKeys.userPreferences);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserPreferences>;
        set({ ...DEFAULT_PREFERENCES, ...parsed, isHydrated: true });
        return;
      }
    } catch {
      // ignore corrupt prefs
    }
    set({ isHydrated: true });
  },

  setLanguage: async (language) => {
    set({ language });
    await persist(pickPrefs(get()));
  },

  setPreference: async (key, value) => {
    set({ [key]: value } as Partial<PreferencesState>);
    await persist(pickPrefs(get()));
  },

  toggle: async (key) => {
    const current = get()[key];
    if (typeof current !== 'boolean') return;
    set({ [key]: !current } as Partial<PreferencesState>);
    await persist(pickPrefs(get()));
  },
}));
