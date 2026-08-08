import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

import { AppConfig } from '@/constants/config';

/**
 * Redirect URL for OAuth / magic-link / password-reset.
 * Prefer Expo Auth Session URI so Google → Supabase → app round-trip works.
 */
export function getAuthRedirectUrl(): string {
  return makeRedirectUri({
    scheme: AppConfig.scheme,
    path: 'auth/callback',
  });
}

/** Fallback native scheme (non-web). */
export function getNativeAuthRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return Linking.createURL('auth/callback', {
    scheme: AppConfig.scheme,
  });
}

/** Parse query + hash params from a deep link / redirect URL. */
export function parseAuthUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  const queryPart =
    queryIndex >= 0
      ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
      : '';
  const hashPart = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';

  for (const part of [queryPart, hashPart]) {
    if (!part) continue;
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [rawKey, rawValue = ''] = pair.split('=');
      if (!rawKey) continue;
      params[decodeURIComponent(rawKey)] = decodeURIComponent(
        rawValue.replace(/\+/g, ' '),
      );
    }
  }

  return params;
}
