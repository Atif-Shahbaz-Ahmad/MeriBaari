import { useColorScheme as useSystemColorScheme } from 'react-native';

import { DarkTheme, LightTheme, type AppTheme } from '@/constants/colors';
import { useThemeStore } from '@/store/theme-store';

export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const preference = useThemeStore((state) => state.preference);

  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }

  return preference;
}

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}
