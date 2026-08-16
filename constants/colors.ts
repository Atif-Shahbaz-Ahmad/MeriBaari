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

/** Semantic tint used for badges, chips, banners, and icon wells. */
export type SemanticTint = {
  bg: string;
  bgStrong: string;
  fg: string;
  border: string;
};

export type SemanticTints = {
  primary: SemanticTint;
  secondary: SemanticTint;
  accent: SemanticTint;
  error: SemanticTint;
  muted: SemanticTint;
};

export const LightTints: SemanticTints = {
  primary: {
    bg: Colors.primary50,
    bgStrong: Colors.primary100,
    fg: Colors.primary600,
    border: Colors.primary100,
  },
  secondary: {
    bg: Colors.secondary50,
    bgStrong: Colors.secondary100,
    fg: Colors.secondary600,
    border: Colors.secondary100,
  },
  accent: {
    bg: Colors.accent50,
    bgStrong: Colors.accent100,
    fg: '#B45309',
    border: Colors.accent100,
  },
  error: {
    bg: Colors.error50,
    bgStrong: Colors.error100,
    fg: Colors.error,
    border: Colors.error100,
  },
  muted: {
    bg: Colors.borderLight,
    bgStrong: Colors.border,
    fg: Colors.textSecondary,
    border: Colors.border,
  },
};

export const DarkTints: SemanticTints = {
  primary: {
    bg: '#1E3A5F',
    bgStrong: '#1E4A7A',
    fg: '#93C5FD',
    border: '#2563EB',
  },
  secondary: {
    bg: '#14532D',
    bgStrong: '#166534',
    fg: '#6EE7B7',
    border: '#10B981',
  },
  accent: {
    bg: '#422006',
    bgStrong: '#78350F',
    fg: '#FCD34D',
    border: '#F59E0B',
  },
  error: {
    bg: '#450A0A',
    bgStrong: '#7F1D1D',
    fg: '#FCA5A5',
    border: '#EF4444',
  },
  muted: {
    bg: '#273549',
    bgStrong: '#334155',
    fg: '#94A3B8',
    border: '#334155',
  },
};

export const LightTheme = {
  background: Colors.background,
  card: Colors.card,
  input: Colors.card,
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
  isDark: false,
  tints: LightTints,
} as const;

export const DarkTheme = {
  background: Colors.darkBackground,
  card: Colors.darkCard,
  input: '#273549',
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
  isDark: true,
  tints: DarkTints,
} as const;

export type AppTheme = {
  background: string;
  card: string;
  input: string;
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
  isDark: boolean;
  tints: SemanticTints;
};
