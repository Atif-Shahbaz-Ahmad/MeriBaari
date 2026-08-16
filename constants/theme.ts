import { Colors, DarkTheme, LightTheme } from './colors';
import { Radius, Shadows, Spacing } from './spacing';
import { Typography } from './typography';
import { AppConfig, StorageKeys } from './config';

export type { AppTheme, SemanticTint, SemanticTints } from './colors';
export { DarkTints, LightTints } from './colors';

export const Theme = {
  colors: Colors,
  light: LightTheme,
  dark: DarkTheme,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  typography: Typography,
  config: AppConfig,
  storage: StorageKeys,
} as const;

export { Colors, DarkTheme, LightTheme, Spacing, Radius, Shadows, Typography, AppConfig, StorageKeys };
