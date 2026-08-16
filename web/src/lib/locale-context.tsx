'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useSyncExternalStore } from 'react';

import {
  getLanguage,
  isRtlLanguage,
  subscribeLocale,
  t as translate,
} from '@/lib/i18n';
import type { AppLanguage } from '@/types';

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export type LocaleContextValue = {
  t: TranslateFn;
  language: AppLanguage;
  isRTL: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const language = useSyncExternalStore(
    subscribeLocale,
    getLanguage,
    getLanguage,
  );
  const isRTL = isRtlLanguage(language);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(key, params),
    // Recreate when the catalog language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  const value = useMemo(
    () => ({ t, language, isRTL }),
    [t, language, isRTL],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue | null {
  return useContext(LocaleContext);
}
