import * as Sentry from '@sentry/react';

import {
  registerErrorReporter,
  resolveSentryEnvironment,
  setErrorReportingEnabled,
} from '@/lib/monitoring';
import { sanitizeSentryEvent } from '@/lib/sentry-sanitize';

const dsn = import.meta.env.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN || '';

const environment = resolveSentryEnvironment(
  import.meta.env.VITE_SENTRY_ENVIRONMENT || process.env.VITE_SENTRY_ENVIRONMENT,
  import.meta.env.DEV ? 'development' : 'production',
);

const release =
  import.meta.env.VITE_SENTRY_RELEASE ||
  process.env.VITE_SENTRY_RELEASE ||
  `meribaari-desktop@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`;

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment,
  release,
  sendDefaultPii: false,
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    return sanitizeSentryEvent(event);
  },
});

if (dsn) {
  setErrorReportingEnabled(true);
  registerErrorReporter((error, context) => {
    Sentry.withScope((scope) => {
      scope.setTag('platform', 'desktop');
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

export { Sentry };
