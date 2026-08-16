'use client';

import { useBackendHealth } from '@/hooks/use-backend-health';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@web/lib/cn';

export function ConnectionBanner() {
  const { t } = useTranslation();
  const { connection } = useBackendHealth();

  if (connection === 'online') return null;

  const message =
    connection === 'offline'
      ? t('web.connection.offline')
      : connection === 'reconnecting'
        ? t('web.connection.reconnecting')
        : connection === 'restored'
          ? t('web.connection.restored')
          : t('web.connection.unavailable');

  return (
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
      {message}
    </div>
  );
}
