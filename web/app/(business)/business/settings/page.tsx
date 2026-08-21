'use client';

import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from '@/mock/preferences';
import { LogoutButton } from '@web/components/LogoutButton';
import { Button, Card } from '@web/components/ui';
import { useTranslation } from '@/hooks/use-translation';
import Link from 'next/link';

export default function BusinessSettingsPage() {
  const { t } = useTranslation();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
      <Card className="space-y-3">
        <h2 className="font-semibold">{t('profile.language')}</h2>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={language === opt.value ? 'primary' : 'ghost'}
              onClick={() => void setLanguage(opt.value)}
            >
              {opt.nativeLabel}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-semibold">{t('profile.theme')}</h2>
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={preference === opt.value ? 'primary' : 'ghost'}
              onClick={() => void setPreference(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold">{t('profile.privacy')}</h2>
        <p className="text-sm text-ink-secondary">{t('profile.privacyBusinessBody')}</p>
        <Link className="text-sm font-semibold text-primary" href="/privacy">
          {t('profile.privacyBusinessTitle')}
        </Link>
      </Card>
      <LogoutButton variant="danger">{t('common.signOut')}</LogoutButton>
    </div>
  );
}
