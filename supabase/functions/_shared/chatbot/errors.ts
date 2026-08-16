export type ChatFailureCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_data'
  | 'timeout'
  | 'network'
  | 'not_configured'
  | 'rate_limited'
  | 'unavailable'
  | 'unknown';

export type GeminiFailureCategory =
  | 'timeout'
  | 'rate_limited'
  | 'network'
  | 'unavailable'
  | 'not_configured'
  | 'unknown';

export class AssistantError extends Error {
  readonly code: ChatFailureCode;
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;

  constructor(
    code: ChatFailureCode,
    message: string,
    httpStatus: number,
    retryable: boolean,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'AssistantError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class GeminiRequestError extends Error {
  readonly category: GeminiFailureCategory;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;

  constructor(
    category: GeminiFailureCategory,
    message: string,
    status: number | undefined,
    retryable: boolean,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'GeminiRequestError';
    this.category = category;
    this.status = status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

export const USER_MESSAGE: Record<ChatFailureCode, string> = {
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'This assistant is only available for business owner accounts.',
  invalid_data: 'Please enter a shorter message and try again.',
  timeout: 'The assistant took too long to respond. Please try again.',
  network: 'Something went wrong while connecting. Please try again.',
  not_configured: 'The assistant is not available yet.',
  rate_limited: 'The assistant is temporarily busy. Please try again in a moment.',
  unavailable: 'The assistant is temporarily unavailable. Please try again in a moment.',
  unknown: 'Something went wrong. Please try again.',
};

export function isRetryableCode(code: ChatFailureCode): boolean {
  return (
    code === 'timeout' ||
    code === 'network' ||
    code === 'unavailable' ||
    code === 'unknown'
  );
}

/** Burst RPM 429s may include a short Retry-After. Longer/missing delays are quota. */
export const MAX_BURST_RETRY_MS = 2_000;

export function parseRetryAfterMs(
  headers: Headers,
  json: {
    error?: {
      message?: string;
      details?: unknown;
    };
  },
): number | undefined {
  const header = headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.round(seconds * 1000);
    }
    const dateMs = Date.parse(header);
    if (Number.isFinite(dateMs)) {
      return Math.max(0, dateMs - Date.now());
    }
  }

  const details = json.error?.details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (!detail || typeof detail !== 'object') continue;
      const retryDelay = (detail as { retryDelay?: unknown }).retryDelay;
      const fromDetail = parseDurationMs(retryDelay);
      if (fromDetail != null) return fromDetail;
    }
  }

  return parseDurationMs(json.error?.message);
}

function parseDurationMs(raw: unknown): number | undefined {
  if (typeof raw !== 'string') return undefined;
  const match = raw.match(/(\d+(?:\.\d+)?)\s*s/i);
  if (!match) return undefined;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.round(seconds * 1000);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with jitter. attempt 1 → ~400ms, 2 → ~1000ms. */
export function backoffDelayMs(failedAttempt: number): number {
  const base = failedAttempt <= 1 ? 400 : 400 * 2 ** Math.min(failedAttempt - 1, 3);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(2_000, base + jitter);
}

export function logEvent(
  event: string,
  meta: Record<string, unknown> = {},
): void {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...meta }));
}
