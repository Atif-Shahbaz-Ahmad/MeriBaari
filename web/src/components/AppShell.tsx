'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  Bell,
  Building2,
  ClipboardList,
  Heart,
  Home,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  Ticket,
  Users,
  BarChart3,
  CreditCard,
  Layers,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';
import { ConnectionBanner } from '@web/components/ConnectionBanner';
import { Logo } from '@web/components/Logo';
import { LogoutButton } from '@web/components/LogoutButton';
import { cn } from '@web/lib/cn';

type NavItem = { href: string; label: string; icon: typeof Home };

export function AppShell({
  area,
  children,
}: {
  area: 'customer' | 'business';
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const scheme = useColorScheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount();

  const customerNav: NavItem[] = [
    { href: '/customer/home', label: t('tabs.customer.home'), icon: Home },
    { href: '/customer/discover', label: t('web.nav.discover'), icon: Search },
    { href: '/customer/nearby', label: t('web.nav.nearby'), icon: MapPin },
    { href: '/customer/tickets', label: t('tabs.customer.tickets'), icon: Ticket },
    { href: '/customer/favorites', label: t('web.nav.favorites'), icon: Heart },
    { href: '/customer/notifications', label: t('tabs.customer.notifications'), icon: Bell },
    { href: '/customer/assistant', label: t('web.nav.assistant'), icon: MessageCircle },
    { href: '/customer/profile', label: t('tabs.customer.profile'), icon: Users },
  ];

  const businessNav: NavItem[] = [
    { href: '/business/dashboard', label: t('tabs.business.dashboard'), icon: LayoutDashboard },
    { href: '/business/queue', label: t('tabs.business.queue'), icon: ClipboardList },
    { href: '/business/customers', label: t('web.nav.customers'), icon: Users },
    { href: '/business/tickets', label: t('tabs.customer.tickets'), icon: Ticket },
    { href: '/business/services', label: t('tabs.business.services'), icon: Layers },
    { href: '/business/departments', label: t('web.nav.departments'), icon: Building2 },
    { href: '/business/history', label: t('web.nav.history'), icon: ClipboardList },
    { href: '/business/analytics', label: t('web.nav.analytics'), icon: BarChart3 },
    { href: '/business/assistant', label: t('web.nav.assistant'), icon: MessageCircle },
    { href: '/business/notifications', label: t('web.nav.notifications'), icon: Bell },
    { href: '/business/profile', label: t('tabs.business.profile'), icon: Building2 },
    { href: '/business/subscription', label: t('web.nav.subscription'), icon: CreditCard },
    { href: '/business/settings', label: t('web.nav.settings'), icon: Settings },
  ];

  const items = area === 'customer' ? customerNav : businessNav;

  return (
    <div className="min-h-screen bg-surface text-ink">
      <ConnectionBanner />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface-card px-4 py-3 lg:hidden">
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} showTagline={false} />
        <button
          type="button"
          className="rounded-xl border border-line px-3 py-2 text-sm"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('web.nav.closeMenu') : t('web.nav.menu')}
        </button>
      </header>
      {open ? (
        <nav id="mobile-nav" className="border-b border-line bg-surface-card p-3 lg:hidden">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              badge={
                item.href.includes('notifications') ? unread.data ?? 0 : 0
              }
              onClick={() => setOpen(false)}
            />
          ))}
          <LogoutButton className="mt-3 w-full" variant="ghost">
            {t('common.signOut')}
          </LogoutButton>
        </nav>
      ) : null}

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-line bg-surface-card p-4 lg:block">
          <Logo variant={scheme === 'dark' ? 'dark' : 'light'} />
          <p className="mt-4 truncate text-sm text-ink-secondary">
            {user?.fullName || user?.email}
          </p>
          <nav className="mt-6 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname.startsWith(item.href)}
                badge={
                  item.href.includes('notifications') ? unread.data ?? 0 : 0
                }
              />
            ))}
          </nav>
          <LogoutButton className="mt-6 w-full" variant="ghost">
            {t('common.signOut')}
          </LogoutButton>
        </aside>
        <main id="main" className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  badge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-ink-secondary hover:bg-surface hover:text-ink',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span className="flex items-center gap-2">
        <Icon size={18} />
        {item.label}
      </span>
      {badge ? (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
