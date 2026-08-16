import { AppConfig } from '@/constants/config';

export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return `/${AppConfig.scheme}/auth/callback`;
}

export function getNativeAuthRedirectUrl(): string {
  return getAuthRedirectUrl();
}

export function isPasswordRecoveryUrl(url: string): boolean {
  const params = parseAuthUrlParams(url);
  const type = (params.type ?? '').toLowerCase();
  return type === 'recovery';
}

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
