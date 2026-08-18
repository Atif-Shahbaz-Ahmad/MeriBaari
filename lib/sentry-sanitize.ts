const SENSITIVE_KEY =
  /(?:^|[_-])(key|token|secret|password|authorization|cookie|session|jwt|bearer|prompt|ssml|audio|base64|refresh)(?:s|[_-]|$)|api[_-]?key|service[_-]?role|access[_-]?token|refresh[_-]?token|payment[_-]?proof|private[_-]?key/i;

const SECRET_VALUE =
  /(?:sk_live|sk_test|sb_secret|service_role|Bearer\s+[A-Za-z0-9._-]+|ya29\.|AIza[0-9A-Za-z_-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/;

const AUDIO_KEY = /audio|recording|microphone|base64|ssml|prompt/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key) || AUDIO_KEY.test(key);
}

export function looksLikeSecret(value: string): boolean {
  if (SECRET_VALUE.test(value)) return true;
  if (value.length > 80 && /^[A-Za-z0-9+/=._-]{80,}$/.test(value)) return true;
  return false;
}

export function sanitizeSentryValue(key: string, value: unknown, depth = 0): unknown {
  if (isSensitiveKey(key)) return '[Filtered]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (looksLikeSecret(value)) return '[Filtered]';
    if (value.length > 1500) return `${value.slice(0, 200)}…[truncated]`;
    return value;
  }
  if (typeof value !== 'object' || depth > 4) return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item, index) => sanitizeSentryValue(String(index), item, depth + 1));
  }
  const output: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    output[childKey] = sanitizeSentryValue(childKey, childValue, depth + 1);
  }
  return output;
}

export function sanitizeSentryEvent<T>(event: T): T {
  const next = event as Record<string, unknown>;
  if (next.extra && typeof next.extra === 'object') {
    next.extra = sanitizeSentryValue('extra', next.extra);
  }
  if (next.contexts && typeof next.contexts === 'object') {
    next.contexts = sanitizeSentryValue('contexts', next.contexts);
  }
  if (next.request && typeof next.request === 'object') {
    const request = { ...(next.request as Record<string, unknown>) };
    delete request.cookies;
    delete request.data;
    if (request.headers && typeof request.headers === 'object') {
      request.headers = sanitizeSentryValue('headers', request.headers);
    }
    next.request = request;
  }
  if (typeof next.message === 'string' && looksLikeSecret(next.message)) {
    next.message = '[Filtered]';
  }
  return event;
}
