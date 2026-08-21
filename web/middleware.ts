import { type NextRequest } from 'next/server';

import { redirectWithSessionCookies, updateSession } from './src/lib/supabase-middleware';

const AUTH_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/role-select',
  '/auth/callback',
];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, role } = await updateSession(request);

  const isCustomer = pathname === '/customer' || pathname.startsWith('/customer/');
  const isBusinessApp =
    pathname === '/business' ||
    (pathname.startsWith('/business/') && !pathname.startsWith('/businesses'));
  const isAdminApp = pathname === '/admin' || pathname.startsWith('/admin/');

  if ((isCustomer || isBusinessApp || isAdminApp) && !user) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return redirectWithSessionCookies(login, response);
  }

  if (isAdminApp && role && role !== 'admin') {
    if (role === 'business') {
      return redirectWithSessionCookies(
        new URL('/business/dashboard', request.url),
        response,
      );
    }
    if (role === 'customer') {
      return redirectWithSessionCookies(
        new URL('/customer/home', request.url),
        response,
      );
    }
    return redirectWithSessionCookies(new URL('/role-select', request.url), response);
  }

  if (isCustomer && role && role !== 'customer') {
    if (role === 'business') {
      return redirectWithSessionCookies(
        new URL('/business/dashboard', request.url),
        response,
      );
    }
    if (role === 'admin') {
      return redirectWithSessionCookies(new URL('/admin', request.url), response);
    }
    return redirectWithSessionCookies(new URL('/role-select', request.url), response);
  }

  if (isBusinessApp && role && role !== 'business') {
    if (role === 'customer') {
      return redirectWithSessionCookies(
        new URL('/customer/home', request.url),
        response,
      );
    }
    if (role === 'admin') {
      return redirectWithSessionCookies(new URL('/admin', request.url), response);
    }
    return redirectWithSessionCookies(new URL('/role-select', request.url), response);
  }

  if (user && isAuthPath(pathname) && pathname !== '/auth/callback' && pathname !== '/role-select') {
    if (role === 'customer') {
      return redirectWithSessionCookies(
        new URL('/customer/home', request.url),
        response,
      );
    }
    if (role === 'business') {
      return redirectWithSessionCookies(
        new URL('/business/dashboard', request.url),
        response,
      );
    }
    if (role === 'admin') {
      return redirectWithSessionCookies(new URL('/admin', request.url), response);
    }
    return redirectWithSessionCookies(new URL('/role-select', request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
