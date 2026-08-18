'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export function SentryTestClient() {
  const [clientStatus, setClientStatus] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <h1 className="text-2xl font-bold">Sentry test</h1>
      <p className="text-sm text-ink-secondary">
        Development and preview only. This page is hidden in production.
      </p>
      <button
        type="button"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        onClick={async () => {
          Sentry.captureException(new Error('MeriBaari Sentry test error'));
          await Sentry.flush(2000);
          setClientStatus(
            process.env.NEXT_PUBLIC_SENTRY_DSN
              ? 'Client test exception sent.'
              : 'NEXT_PUBLIC_SENTRY_DSN is not set.',
          );
        }}
      >
        Send client test exception
      </button>
      {clientStatus ? <p className="text-sm">{clientStatus}</p> : null}
      <button
        type="button"
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
        onClick={async () => {
          const response = await fetch('/api/dev/sentry-test', { method: 'POST' });
          const json = (await response.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
          };
          setServerStatus(
            response.ok && json.ok
              ? 'Server test exception sent.'
              : json.error || `Server test failed (${response.status}).`,
          );
        }}
      >
        Send server test exception
      </button>
      {serverStatus ? <p className="text-sm">{serverStatus}</p> : null}
    </main>
  );
}
