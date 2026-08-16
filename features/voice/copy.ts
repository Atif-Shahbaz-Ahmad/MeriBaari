import en from '@/locales/en.json';
import ur from '@/locales/ur.json';

import type { ReplyStyle } from '@/domain/models/reply-style';
import type { AppLanguage } from '@/types';
import type { TranslateFn } from '@/lib/i18n/locale-context';

type Dict = Record<string, unknown>;

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Dict)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

/**
 * Voice chrome/errors in English, Urdu script, or Roman Urdu.
 * App language is the default; a detected reply style overrides it.
 */
export function getVoiceCopy(
  t: TranslateFn,
  key: string,
  options: { language: AppLanguage; replyStyle?: ReplyStyle | null },
): string {
  const style = options.replyStyle;
  if (style === 'roman_urdu') {
    return getByPath(en, `voice.roman.${key}`) ?? t(`voice.${key}`);
  }
  if (style === 'urdu_script') {
    return getByPath(ur, `voice.${key}`) ?? t(`voice.${key}`);
  }
  if (style === 'english') {
    return getByPath(en, `voice.${key}`) ?? t(`voice.${key}`);
  }
  return t(`voice.${key}`);
}
