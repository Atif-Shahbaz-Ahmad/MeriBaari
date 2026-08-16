'use client';

import { DarkTheme, LightTheme, type AppTheme } from '@/constants/colors';
import { useThemeStore } from '@/store/theme-store';
import { useSyncExternalStore } from 'react';

function subscribeSystem(callback: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function useColorScheme(): 'light' | 'dark' {
  const system = useSyncExternalStore(
    subscribeSystem,
    getSystemScheme,
    () => 'light' as const,
  );
  const preference = useThemeStore((state) => state.preference);
  if (preference === 'system') return system;
  return preference;
}

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}
