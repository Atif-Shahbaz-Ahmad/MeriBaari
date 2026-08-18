export type SentryEnvironment = 'development' | 'preview' | 'staging' | 'production';

export type MonitoringContext = {
  feature?: string;
  provider?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
};

type ErrorReporter = (error: unknown, context?: MonitoringContext) => void;

let reporter: ErrorReporter | null = null;
let enabled = false;

export function registerErrorReporter(fn: ErrorReporter): void {
  reporter = fn;
}

export function setErrorReportingEnabled(value: boolean): void {
  enabled = value;
}

export function isErrorReportingEnabled(): boolean {
  return enabled;
}

export function reportError(error: unknown, context?: MonitoringContext): void {
  if (!reporter) return;
  try {
    reporter(error, context);
  } catch {
    /* Monitoring must never affect app behavior. */
  }
}

export function triggerSentryTestException(platform: string): Error {
  const error = new Error(`MeriBaari Sentry test exception (${platform})`);
  error.name = 'SentryTestError';
  reportError(error, {
    feature: 'sentry-test',
    tags: { platform, 'sentry.test': 'true' },
  });
  return error;
}

export function resolveSentryEnvironment(
  raw: string | undefined,
  fallback: SentryEnvironment,
): SentryEnvironment {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'production' || value === 'prod') return 'production';
  if (value === 'staging' || value === 'stage') return 'staging';
  if (value === 'preview') return 'preview';
  if (value === 'development' || value === 'dev') return 'development';
  return fallback;
}
