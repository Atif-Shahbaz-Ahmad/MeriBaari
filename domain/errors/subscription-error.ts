export type SubscriptionErrorCode =
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_data'
  | 'proof_required'
  | 'already_pending'
  | 'already_active'
  | 'renewal_cooldown'
  | 'upload_failed'
  | 'network'
  | 'unknown';

export class SubscriptionError extends Error {
  readonly code: SubscriptionErrorCode;

  constructor(code: SubscriptionErrorCode, message: string) {
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
    Object.setPrototypeOf(this, SubscriptionError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<SubscriptionErrorCode, string> = {
  not_found: 'Payment record not found.',
  unauthorized: 'Please sign in to continue.',
  forbidden: 'You do not have permission to do that.',
  invalid_data: 'Please check the payment details and try again.',
  proof_required: 'Please upload a clear screenshot of your payment receipt.',
  already_pending: 'A payment is already waiting for review.',
  already_active: 'Your business is already live on MeriBaari.',
  renewal_cooldown:
    'You can submit the next subscription payment 31 days after the last admin approval.',
  upload_failed: 'Could not upload the payment screenshot. Please try again.',
  network: 'Network error. Check your connection and try again.',
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

export function getSubscriptionErrorMessage(error: unknown): string {
  if (error instanceof SubscriptionError) {
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

export function toSubscriptionError(error: unknown): SubscriptionError {
  if (error instanceof SubscriptionError) return error;

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
    return new SubscriptionError('network', FRIENDLY.network);
  }

  if (lower.includes('proof_required') || lower.includes('proof required')) {
    return new SubscriptionError('proof_required', FRIENDLY.proof_required);
  }
  if (lower.includes('payment_already_pending') || lower.includes('already waiting')) {
    return new SubscriptionError('already_pending', FRIENDLY.already_pending);
  }
  if (lower.includes('already_active')) {
    return new SubscriptionError('already_active', FRIENDLY.already_active);
  }
  if (lower.includes('payment_cooldown')) {
    return new SubscriptionError('renewal_cooldown', FRIENDLY.renewal_cooldown);
  }
  if (lower.includes('visibility_reason_required')) {
    return new SubscriptionError(
      'invalid_data',
      'Please provide a reason for hiding this business.',
    );
  }
  if (lower.includes('unauthorized') || status === 401) {
    return new SubscriptionError('unauthorized', FRIENDLY.unauthorized);
  }
  if (
    status === 403 ||
    code === '42501' ||
    lower.includes('forbidden') ||
    lower.includes('permission') ||
    lower.includes('row-level security')
  ) {
    return new SubscriptionError('forbidden', FRIENDLY.forbidden);
  }
  if (status === 404 || code === 'PGRST116' || lower.includes('not found')) {
    return new SubscriptionError('not_found', FRIENDLY.not_found);
  }
  if (lower.includes('storage') || lower.includes('upload')) {
    return new SubscriptionError('upload_failed', FRIENDLY.upload_failed);
  }

  return new SubscriptionError(
    'unknown',
    isUsableMessage(rawMessage) ? rawMessage.trim() : FRIENDLY.unknown,
  );
}
