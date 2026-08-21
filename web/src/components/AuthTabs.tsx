import Link from 'next/link';

import { cn } from '@web/lib/cn';

export function AuthTabs({ active }: { active: 'login' | 'signup' }) {
  const tab = (href: string, label: string, isActive: boolean) => (
    <Link
      href={href}
      className={cn(
        'pb-1 text-sm font-semibold',
        isActive
          ? 'border-b-2 border-ink text-ink'
          : 'border-b-2 border-transparent text-ink-muted hover:text-ink-secondary',
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav className="mt-4 flex gap-6" aria-label="Account">
      {tab('/login', 'Login', active === 'login')}
      {tab('/signup', 'SignUp', active === 'signup')}
    </nav>
  );
}
