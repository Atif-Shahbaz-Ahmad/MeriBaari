import * as Sentry from '@sentry/nextjs';

import { getWebSentryOptions } from './src/lib/sentry-options';

const options = getWebSentryOptions();

Sentry.init({
  ...options,
});
