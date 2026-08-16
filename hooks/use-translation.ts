import { useCallback, useMemo, useSyncExternalStore } from 'react';

import {
  getLanguage,
  isRtlLanguage,
  subscribeLocale,
  t as translate,
} from '@/lib/i18n';
import { useLocaleContext, type TranslateFn } from '@/lib/i18n/locale-context';

/**
 * Reactive translations. Prefer this over calling `t()` from `@/lib/i18n`
 * directly so the component re-renders when the language changes.
 */
export function useTranslation() {
  const ctx = useLocaleContext();
  const language = useSyncExternalStore(
    subscribeLocale,
    getLanguage,
    getLanguage,
  );

  const t = useCallback<TranslateFn>(
    (key, params) => translate(key, params),
    [language],
  );

  return useMemo(() => {
    if (ctx) return ctx;
    return {
      t,
      language,
      isRTL: isRtlLanguage(language),
    };
  }, [ctx, t, language]);
}
