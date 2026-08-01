export const AppConfig = {
  name: 'MeriBaari',
  tagline: 'My Turn',
  scheme: 'meribaari',
} as const;

export const StorageKeys = {
  onboardingComplete: 'meribaari_onboarding_complete',
  authSession: 'meribaari_auth_session',
  themePreference: 'meribaari_theme_preference',
  demoUser: 'meribaari_demo_user',
} as const;
