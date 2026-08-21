import Link from 'next/link';

import { cn } from '@web/lib/cn';

export function AuthTabs({ active }: { active: 'login' | 'signup' }) {
  return (
    <nav className="mt-3 flex gap-6" aria-label="Account">
      <Link
        href="/login"
        className={cn(
          'pb-1 text-sm font-semibold',
          active === 'login'
            ? 'border-b-2 border-ink text-ink'
            : 'border-b-2 border-transparent text-ink-muted hover:text-ink',
        )}
      >
        Login
      </Link>
      <Link
        href="/signup"
        className={cn(
          'pb-1 text-sm font-semibold',
          active === 'signup'
            ? 'border-b-2 border-ink text-ink'
            : 'border-b-2 border-transparent text-ink-muted hover:text-ink',
        )}
      >
        SignUp
      </Link>
    </nav>
  );
}
