'use client';

import { useAuth } from '@/hooks/use-auth';
import { useColorScheme, useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';
import { Button, Card, Input } from '@web/components/ui';
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from '@/mock/preferences';
import { useState } from 'react';
import Link from 'next/link';

export default function CustomerProfilePage() {
  const { t } = useTranslation();
  const { profile, updateProfile, signOut, isLoading } = useAuth();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const theme = useTheme();
  useColorScheme();
  const [name, setName] = useState(profile?.fullName ?? '');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('tabs.customer.profile')}</h1>
      <Card className="space-y-3">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-sm text-ink-secondary">{profile?.email}</p>
        <Button
          disabled={isLoading}
          onClick={() => void updateProfile({ fullName: name })}
        >
          {t('common.save')}
        </Button>
      </Card>
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
        <p className="text-xs text-ink-muted">Current contrast uses {theme.isDark ? 'dark' : 'light'} tokens.</p>
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
        <Link className="text-sm font-semibold text-primary" href="/privacy">
          {t('profile.privacyBusinessTitle')}
        </Link>
      </Card>
      <Button variant="danger" onClick={() => void signOut()}>
        {t('common.signOut')}
      </Button>
    </div>
  );
}
