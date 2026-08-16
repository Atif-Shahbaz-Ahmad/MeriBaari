export function makeRedirectUri(options?: { scheme?: string; path?: string }) {
  const path = options?.path ?? 'auth/callback';
  if (typeof window === 'undefined') return `/${path}`;
  return `${window.location.origin}/${path.replace(/^\//, '')}`;
}
