import { create } from 'zustand';

import { StorageKeys } from '@/constants/config';
import { secureStorage } from '@/lib/secure-store';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompletedOnboarding: false,
  isHydrated: false,

  hydrate: async () => {
    const value = await secureStorage.getItem(StorageKeys.onboardingComplete);
    set({ hasCompletedOnboarding: value === 'true', isHydrated: true });
  },

  completeOnboarding: async () => {
    await secureStorage.setItem(StorageKeys.onboardingComplete, 'true');
    set({ hasCompletedOnboarding: true });
  },

  resetOnboarding: async () => {
    await secureStorage.removeItem(StorageKeys.onboardingComplete);
    set({ hasCompletedOnboarding: false });
  },
}));
