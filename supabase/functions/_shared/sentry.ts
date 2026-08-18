/**
 * Deno-compatible Sentry reporter for Supabase Edge Functions.
 *
 * The official `@sentry/deno` SDK is still beta and expects Deno 2 APIs that
 * are not reliably available on the Edge Function isolate. This client uses
 * Sentry's public envelope ingest API, flushes before the isolate freezes,
 * and never sends secrets, audio, prompts, or tokens.
 */

type SentryEnvironment = 'development' | 'preview' | 'staging' | 'production';

export type SentryCaptureContext = {
  functionName: string;
  feature?: string;
  provider?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
};

type ParsedDsn = {
  key: string;
  host: string;
  projectId: string;
};

const SENSITIVE_KEY =
  /(?:^|[_-])(key|token|secret|password|authorization|cookie|session|jwt|bearer|prompt|ssml|audio|base64|refresh)(?:s|[_-]|$)|api[_-]?key|service[_-]?role|access[_-]?token|refresh[_-]?token|payment[_-]?proof|private[_-]?key/i;

const SECRET_VALUE =
  /(?:sk_live|sk_test|sb_secret|service_role|Bearer\s+[A-Za-z0-9._-]+|AIza[0-9A-Za-z_-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/;

const USER_NOISE = new Set(['unauthorized', 'forbidden', 'invalid_data', 'no_speech']);

let parsedDsn: ParsedDsn | null | undefined;
let functionName = 'unknown';
const queue: string[] = [];

export function initFunctionSentry(name: string): void {
  functionName = name;
  if (parsedDsn !== undefined) return;
  parsedDsn = parseDsn(Deno.env.get('SENTRY_DSN'));
}

export function getSentryEnvironment(): SentryEnvironment {
  return resolveEnvironment(
    Deno.env.get('SENTRY_ENVIRONMENT') ?? Deno.env.get('ENVIRONMENT'),
    'production',
  );
}

export function isSentryEnabled(): boolean {
  return Boolean(ensureDsn());
}

export function isSentryTestAllowed(): boolean {
  return Deno.env.get('SENTRY_ALLOW_TEST') === '1' && getSentryEnvironment() !== 'production';
}

export function shouldCaptureFailure(code: string): boolean {
  return !USER_NOISE.has(code);
}

export function captureException(error: unknown, context: SentryCaptureContext): void {
  const dsn = ensureDsn();
  if (!dsn) return;

  const eventId = crypto.randomUUID().replace(/-/g, '');
  const extras = sanitizeValue('extra', {
    ...(context.extras ?? {}),
  }) as Record<string, unknown>;

  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    logger: 'meribaari-functions',
    environment: getSentryEnvironment(),
    release: Deno.env.get('SENTRY_RELEASE') || 'meribaari-functions@1.0.0',
    level: context.level ?? 'error',
    server_name: 'supabase-edge',
    tags: sanitizeTags({
      platform: 'edge-function',
      function: context.functionName || functionName,
      environment: getSentryEnvironment(),
      ...(context.provider ? { provider: context.provider } : {}),
      ...(context.feature ? { feature: context.feature } : {}),
      ...(context.tags ?? {}),
    }),
    extra: extras,
    exception: {
      values: [toExceptionValue(error)],
    },
  };

  const envelopeHeader = JSON.stringify({
    event_id: eventId,
    sent_at: new Date().toISOString(),
  });
  const itemHeader = JSON.stringify({ type: 'event' });
  queue.push(`${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}`);
}

export async function flushSentry(timeoutMs = 2000): Promise<void> {
  const dsn = ensureDsn();
  if (!dsn || queue.length === 0) return;

  const payloads = queue.splice(0, queue.length);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await Promise.all(
      payloads.map((body) =>
        fetch(`https://${dsn.host}/api/${dsn.projectId}/envelope/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-sentry-envelope',
            'X-Sentry-Auth': [
              'Sentry sentry_version=7',
              `sentry_client=meribaari-functions/1.0.0`,
              `sentry_key=${dsn.key}`,
            ].join(', '),
          },
          body,
          signal: controller.signal,
        }).catch(() => undefined),
      ),
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function maybeHandleSentryTest(req: Request, name: string): Promise<Response | null> {
  if (!isSentryTestAllowed()) return null;
  if (req.headers.get('x-sentry-test') !== '1') return null;

  initFunctionSentry(name);
  captureException(new Error(`MeriBaari Sentry test exception (${name})`), {
    functionName: name,
    feature: 'sentry-test',
    tags: { 'sentry.test': 'true' },
  });
  await flushSentry();
  return new Response(JSON.stringify({ ok: true, sentry: 'test_sent', function: name }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ensureDsn(): ParsedDsn | null {
  if (parsedDsn === undefined) {
    parsedDsn = parseDsn(Deno.env.get('SENTRY_DSN'));
  }
  return parsedDsn;
}

function parseDsn(dsn: string | undefined): ParsedDsn | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const key = url.username;
    const projectId = url.pathname.replace(/^\/+/, '').split('/')[0];
    if (!key || !url.host || !projectId) return null;
    return { key, host: url.host, projectId };
  } catch {
    return null;
  }
}

function resolveEnvironment(
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

function toExceptionValue(error: unknown): {
  type: string;
  value: string;
  mechanism: { type: string; handled: boolean };
} {
  if (error instanceof Error) {
    return {
      type: error.name || 'Error',
      value: sanitizeMessage(error.message),
      mechanism: { type: 'generic', handled: true },
    };
  }
  return {
    type: 'Error',
    value: sanitizeMessage(String(error ?? 'Unknown error')),
    mechanism: { type: 'generic', handled: true },
  };
}

function sanitizeMessage(message: string): string {
  if (SECRET_VALUE.test(message)) return '[Filtered]';
  if (message.length > 1500) return `${message.slice(0, 200)}…[truncated]`;
  return message;
}

function sanitizeTags(tags: Record<string, string>): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    if (SENSITIVE_KEY.test(key)) continue;
    output[key] = String(value).slice(0, 200);
  }
  return output;
}

function sanitizeValue(key: string, value: unknown, depth = 0): unknown {
  if (SENSITIVE_KEY.test(key)) return '[Filtered]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (SECRET_VALUE.test(value)) return '[Filtered]';
    if (value.length > 1500) return `${value.slice(0, 200)}…[truncated]`;
    return value;
  }
  if (typeof value !== 'object' || depth > 4) return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item, index) => sanitizeValue(String(index), item, depth + 1));
  }
  const output: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    output[childKey] = sanitizeValue(childKey, childValue, depth + 1);
  }
  return output;
}
