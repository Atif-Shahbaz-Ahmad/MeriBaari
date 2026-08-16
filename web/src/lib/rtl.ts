import { isRtlLanguage, setLocale } from '@/lib/i18n';
import type { AppLanguage } from '@/types';

export function persistNativeRtlPreference(language: AppLanguage): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
  document.documentElement.lang = language === 'ur' ? 'ur' : 'en';
}

export function applyLanguage(language: AppLanguage): void {
  setLocale(language);
  persistNativeRtlPreference(language);
}
