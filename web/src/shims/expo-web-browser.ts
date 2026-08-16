export function maybeCompleteAuthSession() {
  return { type: 'success' as const };
}

export async function openAuthSessionAsync(url: string, _redirect?: string) {
  if (typeof window !== 'undefined') {
    window.location.assign(url);
    return { type: 'success' as const, url };
  }
  return { type: 'cancel' as const, url: '' };
}

