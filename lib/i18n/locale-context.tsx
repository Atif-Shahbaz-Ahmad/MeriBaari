import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { View, StyleSheet } from 'react-native';
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

/**
 * Subscribes the tree to locale changes and applies a reactive writing
 * direction. Native I18nManager RTL is only a next-launch preference.
 */
export function LocaleProvider({ children }: PropsWithChildren) {
  const language = useSyncExternalStore(
    subscribeLocale,
    getLanguage,
    getLanguage,
  );
  const isRTL = isRtlLanguage(language);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(key, params),
    [language],
  );

  const value = useMemo(
    () => ({ t, language, isRTL }),
    [t, language, isRTL],
  );

  return (
    <LocaleContext.Provider value={value}>
      <View
        style={[styles.root, { direction: isRTL ? 'rtl' : 'ltr' }]}
        collapsable={false}
      >
        {children}
      </View>
    </LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue | null {
  return useContext(LocaleContext);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
