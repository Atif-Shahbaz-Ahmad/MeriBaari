import * as Sentry from '@sentry/nextjs';

import { registerErrorReporter, setErrorReportingEnabled } from '@/lib/monitoring';
import { getWebSentryOptions } from './src/lib/sentry-options';

// Static member access so Next.js inlines this into the browser bundle at build time.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const options = getWebSentryOptions();

Sentry.init({
  ...options,
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
});

if (dsn) {
  setErrorReportingEnabled(true);
  registerErrorReporter((error, context) => {
    Sentry.withScope((scope) => {
      scope.setTag('platform', 'web');
      if (context?.level) scope.setLevel(context.level);
      if (context?.feature) scope.setTag('feature', context.feature);
      if (context?.provider) scope.setTag('provider', context.provider);
      if (context?.tags) {
        for (const [key, value] of Object.entries(context.tags)) {
          scope.setTag(key, value);
        }
      }
      if (context?.extras) scope.setExtras(context.extras);
      Sentry.captureException(error);
    });
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
