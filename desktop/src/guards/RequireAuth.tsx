import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppBootstrap } from '@/hooks/use-auth';
import { homeForRole } from '@web/lib/cn';

export function RequireAuth({ role }: { role?: 'customer' | 'business' | 'admin' }) {
  const { isReady, isAuthenticated, role: actualRole } = useAppBootstrap();
  const location = useLocation();

  if (!isReady) {
    return (
      <main className="grid min-h-screen place-items-center text-ink-secondary">
        Loading…
      </main>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (role && actualRole && actualRole !== role) {
    return <Navigate to={homeForRole(actualRole)} replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated, role } = useAppBootstrap();
  if (!isReady) {
    return (
      <main className="grid min-h-screen place-items-center text-ink-secondary">
        Loading…
      </main>
    );
  }
  if (isAuthenticated && role) {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <>{children}</>;
}
