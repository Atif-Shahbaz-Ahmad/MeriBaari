import type { AppLanguage } from '@/types';

import en from '@/locales/en.json';
import ur from '@/locales/ur.json';

type Catalog = typeof en;
type Dict = Record<string, unknown>;

const catalogs: Record<AppLanguage, Catalog> = {
  en,
  ur: ur as Catalog,
};

let currentLanguage: AppLanguage = 'en';
const listeners = new Set<() => void>();

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Dict)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : '',
  );
}

export function getLanguage(): AppLanguage {
  return currentLanguage;
}

export function isRtlLanguage(language: AppLanguage = currentLanguage): boolean {
  return language === 'ur';
}

/** Set active catalog language (does not flip RTL / reload). */
export function setLocale(language: AppLanguage): void {
  if (currentLanguage === language) return;
  currentLanguage = language;
  listeners.forEach((listener) => listener());
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const I18N_KEY = /^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/;

/** True only for catalog keys like `validation.email`, never free-form error text. */
export function hasTranslationKey(key: string): boolean {
  if (!I18N_KEY.test(key)) return false;
  return getByPath(catalogs.en, key) != null || getByPath(catalogs[currentLanguage], key) != null;
}

/**
 * Translate a dotted key. Falls back to English, then the key itself.
 * Params: `t('home.greeting.name', { name: 'Ali' })` with `{{name}}` in catalogs.
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
): string {
  const fromCurrent = getByPath(catalogs[currentLanguage], key);
  const fromEn = getByPath(catalogs.en, key);
  return interpolate(fromCurrent ?? fromEn ?? key, params);
}

export type { AppLanguage };
