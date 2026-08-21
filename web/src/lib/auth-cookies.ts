import { supabaseCookieOptions } from './supabase-env';

type CookieToSet = {
  name: string;
  value: string;
  options?: object;
};

type NextCookieInit = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
};

export function nextCookieOptions(options?: object): NextCookieInit {
  const raw = (options ?? {}) as Record<string, unknown>;
  const sameSiteRaw = raw.sameSite;
  const sameSite =
    sameSiteRaw === 'strict' || sameSiteRaw === 'none' || sameSiteRaw === 'lax'
      ? sameSiteRaw
      : supabaseCookieOptions.sameSite;

  return {
    path: typeof raw.path === 'string' ? raw.path : supabaseCookieOptions.path,
    domain: typeof raw.domain === 'string' ? raw.domain : undefined,
    maxAge: typeof raw.maxAge === 'number' ? raw.maxAge : undefined,
    expires: raw.expires instanceof Date ? raw.expires : undefined,
    httpOnly: raw.httpOnly !== false,
    secure: supabaseCookieOptions.secure,
    sameSite,
  };
}

export function applyCookies(
  setCookie: (name: string, value: string, options?: NextCookieInit) => void,
  cookiesToSet: CookieToSet[],
) {
  for (const { name, value, options } of cookiesToSet) {
    setCookie(name, value, nextCookieOptions(options));
  }
}
