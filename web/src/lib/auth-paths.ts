import { homeForRole } from '@web/lib/cn';

/** Only allow same-origin relative paths so `next` cannot open an external URL. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const next = value.trim();
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//') || next.startsWith('/\\')) return null;
  if (next.includes('\\') || next.includes('://')) return null;
  return next;
}

export function destinationForRole(
  role: string | null | undefined,
  next?: string | null,
): string {
  return safeNextPath(next) ?? homeForRole(role);
}

export function webAuthCallbackUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return `${explicit.replace(/\/$/, '')}/auth/callback`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/auth/callback`;
  return undefined;
}
