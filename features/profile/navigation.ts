import { router, type Href } from 'expo-router';

/** Profile / settings hrefs — cast until Expo typed routes regenerate. */
export const ProfileHref = {
  settings: '/profile/settings' as Href,
  notifications: '/profile/notifications' as Href,
  help: '/profile/help' as Href,
  about: '/profile/about' as Href,
  edit: '/profile/edit' as Href,
  privacy: '/profile/privacy' as Href,
  theme: '/profile/theme' as Href,
  language: '/profile/language' as Href,
};

export function pushSettings() {
  router.push(ProfileHref.settings);
}

export function pushNotificationSettings() {
  router.push(ProfileHref.notifications);
}

export function pushHelp() {
  router.push(ProfileHref.help);
}

export function pushAbout() {
  router.push(ProfileHref.about);
}

export function pushEditProfile() {
  router.push(ProfileHref.edit);
}

export function pushPrivacy() {
  router.push(ProfileHref.privacy);
}

export function pushThemeSettings() {
  router.push(ProfileHref.theme);
}

export function pushLanguageSettings() {
  router.push(ProfileHref.language);
}
