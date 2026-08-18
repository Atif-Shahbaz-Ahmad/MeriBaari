import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import { isWebSentryTestEnabled } from '@web/lib/sentry-options';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!isWebSentryTestEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  Sentry.captureException(new Error('MeriBaari Sentry test error'));
  await Sentry.flush(2000);

  return NextResponse.json({ ok: true });
}
