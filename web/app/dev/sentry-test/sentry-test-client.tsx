'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

// Static member access so Next.js replaces these at build time.
const clientDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
const nodeEnv = process.env.NODE_ENV;

export function SentryTestClient() {
  const [clientStatus, setClientStatus] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <h1 className="text-2xl font-bold">Sentry test</h1>
      <p className="text-sm text-ink-secondary">
        Development and preview only. This page is hidden in production.
      </p>
      <pre className="rounded-lg bg-slate-100 p-3 text-xs text-ink-secondary">
        {`hasClientDsn: ${Boolean(clientDsn)}\nVERCEL_ENV: ${vercelEnv || '(unset)'}\nNODE_ENV: ${nodeEnv || '(unset)'}`}
      </pre>
      <button
        type="button"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        onClick={async () => {
          Sentry.captureException(new Error('MeriBaari Sentry test error'));
          await Sentry.flush(2000);
          setClientStatus(
            clientDsn ? 'Client test exception sent.' : 'NEXT_PUBLIC_SENTRY_DSN is not set.',
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
