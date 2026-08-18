import { resolveSentryEnvironment, type SentryEnvironment } from '@/lib/monitoring';
import { sanitizeSentryEvent } from '@/lib/sentry-sanitize';

export function getWebSentryDsn(): string {
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || '';
}

export function getWebSentryEnvironment(): SentryEnvironment {
  const vercelEnv = process.env.VERCEL_ENV;
  const fallback: SentryEnvironment =
    vercelEnv === 'production' ? 'production' : vercelEnv === 'preview' ? 'preview' : 'development';

  return resolveSentryEnvironment(
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.SENTRY_ENVIRONMENT,
    fallback,
  );
}

export function getWebSentryRelease(): string | undefined {
  if (process.env.NEXT_PUBLIC_SENTRY_RELEASE) {
    return process.env.NEXT_PUBLIC_SENTRY_RELEASE;
  }
  if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return `meribaari-web@${process.env.VERCEL_GIT_COMMIT_SHA}`;
  }
  return 'meribaari-web@1.0.0';
}

export function getWebSentryOptions() {
  const dsn = getWebSentryDsn();
  const environment = getWebSentryEnvironment();

  return {
    dsn: dsn || undefined,
    enabled: Boolean(dsn),
    environment,
    release: getWebSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    beforeSend: sanitizeSentryEvent,
  };
}

export function isWebSentryTestEnabled(): boolean {
  // Prefer Vercel's runtime value. NODE_ENV is "production" on every Vercel
  // deployment (preview included), and NEXT_PUBLIC_VERCEL_ENV can be inlined
  // as "" at build time, which previously hid this page on Preview too.
  const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || '';
  if (vercelEnv === 'production') return false;
  if (vercelEnv === 'preview' || vercelEnv === 'development') return true;
  return process.env.NODE_ENV !== 'production';
}
