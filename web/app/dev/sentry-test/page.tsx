import { notFound } from 'next/navigation';

import { isWebSentryTestEnabled } from '@web/lib/sentry-options';

import { SentryTestClient } from './sentry-test-client';

// Request-time VERCEL_ENV so Preview shows this page and Production 404s.
// Static prerender would freeze NODE_ENV=production and 404 on every Vercel build.
export const dynamic = 'force-dynamic';

export default function SentryTestPage() {
  if (!isWebSentryTestEnabled()) {
    notFound();
  }

  return <SentryTestClient />;
}
