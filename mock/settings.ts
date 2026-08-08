export type SettingsItemKind = 'link' | 'toggle' | 'value' | 'action';



export interface SettingsDefinitionItem {

  id: string;

  label: string;

  description?: string;

  kind: SettingsItemKind;

  /** Preference key for toggles */

  preferenceKey?: string;

  valueLabel?: string;

  route?: 'theme' | 'language' | 'help' | 'about' | 'privacy' | 'edit';

  danger?: boolean;

}



export interface SettingsGroupDefinition {

  id: string;

  title: string;

  items: SettingsDefinitionItem[];

}



export const SETTINGS_GROUPS: SettingsGroupDefinition[] = [

  {

    id: 'general',

    title: 'General',

    items: [

      {

        id: 'language',

        label: 'Language',

        kind: 'value',

        preferenceKey: 'language',

        route: 'language',

      },

      {

        id: 'theme',

        label: 'Theme',

        description: 'Light, dark, or system',

        kind: 'link',

        route: 'theme',

      },

    ],

  },

  {

    id: 'notifications',

    title: 'Notifications',

    items: [

      {

        id: 'push',

        label: 'Push notifications',

        description: 'Allow MeriBaari to send alerts',

        kind: 'toggle',

        preferenceKey: 'pushEnabled',

      },

      {

        id: 'queue-updates',

        label: 'Queue updates',

        description: 'Position changes and delays',

        kind: 'toggle',

        preferenceKey: 'queueUpdates',

      },

      {

        id: 'reminders',

        label: 'Turn reminders',

        description: 'Alerts when your turn approaches',

        kind: 'toggle',

        preferenceKey: 'reminders',

      },

      {

        id: 'system',

        label: 'System alerts',

        kind: 'toggle',

        preferenceKey: 'systemAlerts',

      },

      {

        id: 'promotions',

        label: 'Promotions',

        description: 'Tips and nearby places',

        kind: 'toggle',

        preferenceKey: 'promotions',

      },

      {

        id: 'sound',

        label: 'Notification sounds',

        kind: 'toggle',

        preferenceKey: 'soundEnabled',

      },

      {

        id: 'vibration',

        label: 'Vibration',

        kind: 'toggle',

        preferenceKey: 'vibrationEnabled',

      },

    ],

  },

  {

    id: 'queue',

    title: 'Queue Preferences',

    items: [

      {

        id: 'show-wait',

        label: 'Show estimated wait',

        kind: 'toggle',

        preferenceKey: 'showEstimatedWait',

      },

      {

        id: 'auto-join',

        label: 'Quick-join favorites',

        description: 'Placeholder for future favorites',

        kind: 'toggle',

        preferenceKey: 'autoJoinFavorites',

      },

    ],

  },

  {

    id: 'accessibility',

    title: 'Accessibility',

    items: [

      {

        id: 'reduce-motion',

        label: 'Reduce motion',

        kind: 'toggle',

        preferenceKey: 'reduceMotion',

      },

      {

        id: 'larger-text',

        label: 'Larger text preference',

        description: 'Respects system font scaling',

        kind: 'toggle',

        preferenceKey: 'largerText',

      },

      {

        id: 'contrast',

        label: 'High contrast accents',

        kind: 'toggle',

        preferenceKey: 'highContrast',

      },

    ],

  },

  {

    id: 'privacy',

    title: 'Privacy',

    items: [

      {

        id: 'analytics',

        label: 'Share anonymous analytics',

        kind: 'toggle',

        preferenceKey: 'shareAnalytics',

      },

      {

        id: 'privacy-policy',

        label: 'Privacy Policy',

        kind: 'link',

        route: 'privacy',

      },

    ],

  },

  {

    id: 'account',

    title: 'Account',

    items: [

      {

        id: 'edit-profile',

        label: 'Edit Profile',

        kind: 'link',

        route: 'edit',

      },

    ],

  },

  {

    id: 'about-support',

    title: 'About & Support',

    items: [

      {

        id: 'about',

        label: 'About MeriBaari',

        kind: 'link',

        route: 'about',

      },

      {

        id: 'help',

        label: 'Help & Support',

        kind: 'link',

        route: 'help',

      },

    ],

  },

];

