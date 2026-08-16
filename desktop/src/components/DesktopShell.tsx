import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  Heart,
  Home,
  LayoutDashboard,
  Layers,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  Ticket,
  Users,
  BarChart3,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useBackendHealth } from '@/hooks/use-backend-health';
import { Logo } from '@web/components/Logo';
import { Button } from '@web/components/ui';
import { cn } from '@web/lib/cn';
import { isTauriRuntime } from '../lib/tauri';
import { QueueShortcuts } from './QueueShortcuts';
import { DesktopNotificationBridge } from './DesktopNotificationBridge';

type NavItem = { href: string; label: string; icon: typeof Home };

export function DesktopShell({ area }: { area: 'customer' | 'business' }) {
  const { t } = useTranslation();
  const { user, signOut, isLoading } = useAuth();
  const scheme = useColorScheme();
  const location = useLocation();
  const unread = useUnreadNotificationCount();
  const org = useMyOrganization(area === 'business');
  const { connection } = useBackendHealth();
  const [collapsed, setCollapsed] = useState(false);

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
    { href: '/business/departments', label: t('web.nav.departments'), icon: Building2 },
    { href: '/business/services', label: t('tabs.business.services'), icon: Layers },
    { href: '/business/history', label: t('web.nav.history'), icon: ClipboardList },
    { href: '/business/analytics', label: t('web.nav.analytics'), icon: BarChart3 },
    { href: '/business/assistant', label: t('web.nav.assistant'), icon: MessageCircle },
    { href: '/business/notifications', label: t('web.nav.notifications'), icon: Bell },
    { href: '/business/profile', label: t('tabs.business.profile'), icon: Building2 },
    { href: '/business/subscription', label: t('web.nav.subscription'), icon: CreditCard },
    { href: '/business/settings', label: t('web.nav.settings'), icon: Settings },
  ];

  const items = area === 'customer' ? customerNav : businessNav;
  const title =
    area === 'business'
      ? org.data?.name || t('web.desktop.windowTitle')
      : user?.fullName || t('web.desktop.windowTitle');

  useEffect(() => {
    document.title = `${title} — MeriBaari`;
    if (!isTauriRuntime()) return;
    void import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => getCurrentWindow().setTitle(`${title} — MeriBaari`))
      .catch(() => undefined);
  }, [title]);

  const banner =
    connection === 'offline'
      ? t('web.desktop.offline')
      : connection === 'reconnecting'
        ? t('web.desktop.reconnecting')
        : connection === 'restored'
          ? t('web.desktop.restored')
          : connection === 'unavailable'
            ? t('web.desktop.backendUnavailable')
            : null;

  return (
    <div className="flex h-screen flex-col bg-surface text-ink">
      <DesktopNotificationBridge />
      <QueueShortcuts />
      {banner ? (
        <div
          role="status"
          className={cn(
            'px-4 py-2 text-center text-sm font-medium',
            connection === 'restored'
              ? 'bg-emerald-600 text-white'
              : connection === 'reconnecting'
                ? 'bg-amber-500 text-slate-900'
                : 'bg-red-600 text-white',
          )}
        >
          {banner}
        </div>
      ) : null}
      <header className="flex items-center justify-between border-b border-line bg-surface-card px-4 py-3">
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} showTagline={false} />
        <div className="min-w-0 text-end">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-ink-secondary">
            {user?.email}
          </p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'flex h-full shrink-0 flex-col overflow-y-auto border-e border-line bg-surface-card p-3',
            collapsed ? 'w-16' : 'w-64',
          )}
        >
          <button
            type="button"
            className="mb-3 rounded-lg border border-line px-2 py-1 text-xs text-ink-secondary"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? '»' : '«'}
          </button>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.href);
              const badge = item.href.includes('notifications')
                ? unread.data ?? 0
                : 0;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={item.label}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-ink-secondary hover:bg-surface hover:text-ink',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {collapsed ? null : (
                    <span className="flex flex-1 items-center justify-between gap-2">
                      {item.label}
                      {badge ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                          {badge}
                        </span>
                      ) : null}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <Button
            className="mt-auto"
            variant="ghost"
            disabled={isLoading}
            onClick={() => void signOut()}
          >
            {collapsed ? '⎋' : t('common.signOut')}
          </Button>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
