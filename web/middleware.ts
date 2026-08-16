import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from './src/lib/supabase-middleware';

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
    return NextResponse.redirect(login);
  }

  if (isAdminApp && role && role !== 'admin') {
    if (role === 'business') {
      return NextResponse.redirect(new URL('/business/dashboard', request.url));
    }
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/customer/home', request.url));
    }
    return NextResponse.redirect(new URL('/role-select', request.url));
  }

  if (isCustomer && role && role !== 'customer') {
    if (role === 'business') {
      return NextResponse.redirect(new URL('/business/dashboard', request.url));
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/role-select', request.url));
  }

  if (isBusinessApp && role && role !== 'business') {
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/customer/home', request.url));
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/role-select', request.url));
  }

  if (user && isAuthPath(pathname) && pathname !== '/auth/callback' && pathname !== '/role-select') {
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/customer/home', request.url));
    }
    if (role === 'business') {
      return NextResponse.redirect(new URL('/business/dashboard', request.url));
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/role-select', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
