'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';

import { LocaleProvider } from '@/lib/i18n/locale-context';
import { queryClient } from '@/lib/query-client';
import { useAppBootstrap, useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-theme';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';
import { applyLanguage } from '@/lib/i18n/rtl';

function ThemeSync({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const isHydrated = useThemeStore((state) => state.isHydrated);
  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.classList.toggle('dark', scheme === 'dark');
  }, [scheme, isHydrated]);
  return <>{children}</>;
}

function LocaleSync({ children }: PropsWithChildren) {
  const language = usePreferencesStore((s) => s.language);
  const isHydrated = usePreferencesStore((s) => s.isHydrated);
  useEffect(() => {
    if (!isHydrated) return;
    applyLanguage(language);
  }, [language, isHydrated]);
  return <>{children}</>;
}

function AuthBootstrap({ children }: PropsWithChildren) {
  useAppBootstrap();
  useAuth();
  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthBootstrap>
          <LocaleSync>
            <ThemeSync>{children}</ThemeSync>
          </LocaleSync>
        </AuthBootstrap>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
