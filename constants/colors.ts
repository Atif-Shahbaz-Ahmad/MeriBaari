export const Colors = {
  primary: '#2563EB',
  primary50: '#EFF6FF',
  primary100: '#DBEAFE',
  primary600: '#1D4ED8',
  primary700: '#1E40AF',
  secondary: '#10B981',
  secondary50: '#ECFDF5',
  secondary100: '#D1FAE5',
  secondary600: '#059669',
  accent: '#F59E0B',
  accent50: '#FFFBEB',
  accent100: '#FEF3C7',
  error: '#EF4444',
  error50: '#FEF2F2',
  error100: '#FEE2E2',
  background: '#F8FAFC',
  card: '#FFFFFF',
  darkBackground: '#0F172A',
  darkCard: '#1E293B',
  darkBorder: '#334155',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
} as const;

export const LightTheme = {
  background: Colors.background,
  card: Colors.card,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  textMuted: Colors.textMuted,
  border: Colors.border,
  primary: Colors.primary,
  secondary: Colors.secondary,
  accent: Colors.accent,
  error: Colors.error,
  icon: Colors.textSecondary,
  tabBar: Colors.card,
  tabBarBorder: Colors.border,
} as const;

export const DarkTheme = {
  background: Colors.darkBackground,
  card: Colors.darkCard,
  text: Colors.textInverse,
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: Colors.darkBorder,
  primary: Colors.primary,
  secondary: Colors.secondary,
  accent: Colors.accent,
  error: Colors.error,
  icon: '#94A3B8',
  tabBar: Colors.darkCard,
  tabBarBorder: Colors.darkBorder,
} as const;

export type AppTheme = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  icon: string;
  tabBar: string;
  tabBarBorder: string;
};
