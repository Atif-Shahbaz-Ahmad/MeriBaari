import { I18nManager } from 'react-native';

import { isRtlLanguage, setLocale } from '@/lib/i18n';
import type { AppLanguage } from '@/types';

/**
 * Persist the native RTL flag for the *next* cold start.
 * React Native does not reliably flip Yoga direction in-session;
 * in-session layout uses the LocaleProvider `direction` style instead.
 * Never reloads the app — text switching must stay instant.
 */
export function persistNativeRtlPreference(language: AppLanguage): void {
  const wantRtl = isRtlLanguage(language);
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(wantRtl);
  } catch {
    // Best-effort; in-session UI does not depend on this.
  }
}

/** Sync catalog immediately. Optional native RTL flag for the next launch. */
export function applyLanguage(language: AppLanguage): void {
  setLocale(language);
  persistNativeRtlPreference(language);
}
