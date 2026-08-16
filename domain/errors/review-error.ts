/**
 * Domain review errors with stable codes for UI-friendly mapping.
 */
export type ReviewErrorCode =
  | 'not_found'
  | 'unauthorized'
  | 'permission_denied'
  | 'invalid_data'
  | 'duplicate'
  | 'not_eligible'
  | 'network'
  | 'not_configured'
  | 'unknown';

export class ReviewError extends Error {
  readonly code: ReviewErrorCode;

  constructor(code: ReviewErrorCode, message: string) {
    super(message);
    this.name = 'ReviewError';
    this.code = code;
    Object.setPrototypeOf(this, ReviewError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<ReviewErrorCode, string> = {
  not_found: 'Review not found.',
  unauthorized: 'Please sign in to leave a review.',
  permission_denied: 'You do not have permission to view these reviews.',
  invalid_data: 'Please choose a rating between 1 and 5 stars.',
  duplicate: 'You already reviewed this visit.',
  not_eligible: 'Only completed visits can be reviewed.',
  network: 'Network error. Check your connection and try again.',
  not_configured: 'Reviews are not configured yet.',
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

export function getReviewErrorMessage(error: unknown): string {
  if (error instanceof ReviewError) {
    if (isUsableMessage(error.message)) return error.message.trim();
    return FRIENDLY[error.code] ?? FRIENDLY.unknown;
  }

  if (error instanceof Error && isUsableMessage(error.message)) {
    return error.message.trim();
  }

  if (typeof error === 'string' && isUsableMessage(error)) {
    return error.trim();
  }

  return FRIENDLY.unknown;
}

/** Map Supabase / PostgREST errors to ReviewError. */
export function toReviewError(error: unknown): ReviewError {
  if (error instanceof ReviewError) return error;

  const status =
    error && typeof error === 'object' && 'status' in error
      ? Number((error as { status: unknown }).status)
      : undefined;

  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : undefined;

  const rawMessage =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : typeof error === 'string'
          ? error
          : '';

  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('offline') ||
    lower.includes('timeout') ||
    status === 504 ||
    status === 502 ||
    status === 503
  ) {
    return new ReviewError('network', FRIENDLY.network);
  }

  if (code === '23505' || lower.includes('duplicate') || lower.includes('unique')) {
    return new ReviewError('duplicate', FRIENDLY.duplicate);
  }

  if (
    code === '23514' ||
    lower.includes('completed visit') ||
    lower.includes('only completed') ||
    lower.includes('not eligible')
  ) {
    return new ReviewError('not_eligible', FRIENDLY.not_eligible);
  }

  if (code === 'P0002' || lower.includes('ticket not found')) {
    return new ReviewError('not_found', 'Ticket not found for review.');
  }

  if (status === 401) {
    return new ReviewError('unauthorized', FRIENDLY.unauthorized);
  }

  if (
    status === 403 ||
    code === '42501' ||
    lower.includes('permission') ||
    lower.includes('row-level security') ||
    lower.includes('rls') ||
    lower.includes('own tickets')
  ) {
    return new ReviewError('permission_denied', FRIENDLY.permission_denied);
  }

  if (
    status === 404 ||
    code === 'PGRST116' ||
    lower.includes('not found') ||
    lower.includes('0 rows')
  ) {
    return new ReviewError('not_found', FRIENDLY.not_found);
  }

  if (lower.includes('not configured')) {
    return new ReviewError('not_configured', FRIENDLY.not_configured);
  }

  if (lower.includes('rating') || lower.includes('check constraint') || lower.includes('invalid')) {
    return new ReviewError('invalid_data', FRIENDLY.invalid_data);
  }

  return new ReviewError(
    'unknown',
    isUsableMessage(rawMessage) ? rawMessage.trim() : FRIENDLY.unknown,
  );
}
