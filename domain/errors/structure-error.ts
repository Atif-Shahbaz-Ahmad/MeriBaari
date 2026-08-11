/**
 * Domain errors for departments and services.
 */
export type StructureErrorCode =
  | 'not_found'
  | 'unauthorized'
  | 'permission_denied'
  | 'invalid_data'
  | 'network'
  | 'not_configured'
  | 'unknown';

export class StructureError extends Error {
  readonly code: StructureErrorCode;

  constructor(code: StructureErrorCode, message: string) {
    super(message);
    this.name = 'StructureError';
    this.code = code;
    Object.setPrototypeOf(this, StructureError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<StructureErrorCode, string> = {
  not_found: 'Item not found.',
  unauthorized: 'Please sign in to continue.',
  permission_denied: 'You do not have permission to manage this item.',
  invalid_data: 'Please check the details and try again.',
  network: 'Network error. Check your connection and try again.',
  not_configured: 'This feature is not configured yet.',
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

export function getStructureErrorMessage(error: unknown): string {
  if (error instanceof StructureError) {
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

export function toStructureError(error: unknown): StructureError {
  if (error instanceof StructureError) return error;

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
    return new StructureError('network', FRIENDLY.network);
  }

  if (code === '23514' || lower.includes('check constraint') || lower.includes('invalid')) {
    return new StructureError('invalid_data', FRIENDLY.invalid_data);
  }

  if (status === 401) {
    return new StructureError('unauthorized', FRIENDLY.unauthorized);
  }

  if (
    status === 403 ||
    code === '42501' ||
    lower.includes('permission') ||
    lower.includes('row-level security') ||
    lower.includes('rls')
  ) {
    return new StructureError('permission_denied', FRIENDLY.permission_denied);
  }

  if (
    status === 404 ||
    code === 'PGRST116' ||
    lower.includes('not found') ||
    lower.includes('0 rows')
  ) {
    return new StructureError('not_found', FRIENDLY.not_found);
  }

  return new StructureError(
    'unknown',
    isUsableMessage(rawMessage) ? rawMessage.trim() : FRIENDLY.unknown,
  );
}
