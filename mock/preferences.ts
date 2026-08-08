import type { UserPreferences } from '@/types';



export const DEFAULT_PREFERENCES: UserPreferences = {

  language: 'en',

  pushEnabled: true,

  queueUpdates: true,

  reminders: true,

  systemAlerts: true,

  promotions: false,

  soundEnabled: true,

  vibrationEnabled: true,

  reduceMotion: false,

  largerText: false,

  highContrast: false,

  autoJoinFavorites: false,

  showEstimatedWait: true,

  shareAnalytics: true,

};



export const LANGUAGE_OPTIONS = [

  { value: 'en' as const, label: 'English', nativeLabel: 'English' },

  { value: 'ur' as const, label: 'Urdu', nativeLabel: 'اردو' },

];



export const THEME_OPTIONS = [

  { value: 'system' as const, label: 'System', description: 'Match device settings' },

  { value: 'light' as const, label: 'Light', description: 'Always light appearance' },

  { value: 'dark' as const, label: 'Dark', description: 'Always dark appearance' },

];

