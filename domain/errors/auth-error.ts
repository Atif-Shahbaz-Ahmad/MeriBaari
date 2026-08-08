/**
 * Domain auth errors with stable codes for UI-friendly mapping.
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_exists'
  | 'weak_password'
  | 'unauthorized'
  | 'session_expired'
  | 'network'
  | 'email_not_confirmed'
  | 'invalid_otp'
  | 'rate_limited'
  | 'not_configured'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    // Hermes / RN: ensure message survives Error subclassing
    Object.setPrototypeOf(this, AuthError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Invalid email or password. Please try again.',
  email_exists: 'An account with this email already exists.',
  weak_password: 'Password is too weak. Use at least 6 characters.',
  unauthorized: 'You are not authorized to perform this action.',
  session_expired: 'Your session has expired. Please sign in again.',
  network: 'Network error. Check your connection and try again.',
  email_not_confirmed: 'Please verify your email before signing in.',
  invalid_otp: 'Invalid or expired verification code.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
  not_configured: 'Authentication is not configured.',
  unknown: 'Something went wrong. Please try again.',
};

function isUsableMessage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed !== '{}' &&
    trimmed !== '[object Object]' &&
    trimmed !== 'undefined' &&
    trimmed !== 'null'
  );
}

function readMessageField(error: object): string | null {
  const record = error as Record<string, unknown>;
  for (const key of ['message', 'msg', 'error_description', 'error']) {
    const value = record[key];
    if (isUsableMessage(value)) return value.trim();
  }
  return null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (isUsableMessage(error.message)) return error.message.trim();
    return FRIENDLY[error.code] ?? FRIENDLY.unknown;
  }

  if (error instanceof Error && isUsableMessage(error.message)) {
    return mapSupabaseMessage(error.message.trim());
  }

  if (typeof error === 'string' && isUsableMessage(error)) {
    return mapSupabaseMessage(error.trim());
  }

  if (error && typeof error === 'object') {
    const nested = readMessageField(error);
    if (nested) return mapSupabaseMessage(nested);
  }

  return FRIENDLY.unknown;
}

/** Map raw Supabase / GoTrue messages to AuthError. */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;

  const message = getAuthErrorMessage(error);
  const lower = message.toLowerCase();

  const status =
    error && typeof error === 'object' && 'status' in error
      ? Number((error as { status: unknown }).status)
      : undefined;

  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('offline') ||
    lower.includes('internet') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    status === 504 ||
    status === 502 ||
    status === 503
  ) {
    if (lower.includes('offline') || lower.includes('internet')) {
      return new AuthError(
        'network',
        'You appear to be offline. Check your connection and try again.',
      );
    }
    return new AuthError(
      'network',
      status === 504 || lower.includes('timeout') || lower.includes('timed out')
        ? 'Email delivery timed out. Wait a minute and try again. In development, check your inbox and spam for the Supabase auth email.'
        : FRIENDLY.network,
    );
  }

  if (
    lower.includes('error sending') ||
    lower.includes('unexpected_failure') ||
    status === 500
  ) {
    return new AuthError(
      'unknown',
      'Could not send the verification email. Wait a minute and try again, or check Supabase Auth logs.',
    );
  }

  if (
    lower.includes('invalid login') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password')
  ) {
    return new AuthError('invalid_credentials', FRIENDLY.invalid_credentials);
  }

  if (
    lower.includes('already registered') ||
    lower.includes('user already exists') ||
    lower.includes('email address is already')
  ) {
    return new AuthError('email_exists', FRIENDLY.email_exists);
  }

  if (
    lower.includes('password') &&
    (lower.includes('weak') ||
      lower.includes('at least') ||
      lower.includes('short'))
  ) {
    return new AuthError('weak_password', FRIENDLY.weak_password);
  }

  if (
    lower.includes('email not confirmed') ||
    lower.includes('not confirmed')
  ) {
    return new AuthError('email_not_confirmed', FRIENDLY.email_not_confirmed);
  }

  if (
    lower.includes('security purposes') ||
    lower.includes('only request this after') ||
    lower.includes('rate') ||
    status === 429
  ) {
    return new AuthError(
      'rate_limited',
      isUsableMessage(message) && !lower.includes('something went wrong')
        ? message
        : FRIENDLY.rate_limited,
    );
  }

  if (
    lower.includes('otp') ||
    lower.includes('token') ||
    lower.includes('expired')
  ) {
    if (lower.includes('session') || lower.includes('jwt')) {
      return new AuthError('session_expired', FRIENDLY.session_expired);
    }
    if (lower.includes('otp') || lower.includes('token')) {
      return new AuthError('invalid_otp', FRIENDLY.invalid_otp);
    }
  }

  if (status === 401 || status === 403) {
    return new AuthError('unauthorized', FRIENDLY.unauthorized);
  }

  return new AuthError('unknown', mapSupabaseMessage(message));
}

function mapSupabaseMessage(message: string): string {
  if (!isUsableMessage(message)) return FRIENDLY.unknown;
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) return FRIENDLY.invalid_credentials;
  if (lower.includes('already registered')) return FRIENDLY.email_exists;
  return message.trim();
}
