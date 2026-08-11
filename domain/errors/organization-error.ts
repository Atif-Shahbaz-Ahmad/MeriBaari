/**
 * Domain organization errors with stable codes for UI-friendly mapping.
 */
export type OrganizationErrorCode =
  | 'not_found'
  | 'unauthorized'
  | 'permission_denied'
  | 'invalid_data'
  | 'duplicate'
  | 'network'
  | 'not_configured'
  | 'unknown';

export class OrganizationError extends Error {
  readonly code: OrganizationErrorCode;

  constructor(code: OrganizationErrorCode, message: string) {
    super(message);
    this.name = 'OrganizationError';
    this.code = code;
    Object.setPrototypeOf(this, OrganizationError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<OrganizationErrorCode, string> = {
  not_found: 'Organization not found.',
  unauthorized: 'Please sign in to continue.',
  permission_denied: 'You do not have permission to manage this organization.',
  invalid_data: 'Please check the organization details and try again.',
  duplicate: 'You already have an organization. Edit your existing one instead.',
  network: 'Network error. Check your connection and try again.',
  not_configured: 'Organizations are not configured yet.',
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

export function getOrganizationErrorMessage(error: unknown): string {
  if (error instanceof OrganizationError) {
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

/** Map Supabase / PostgREST errors to OrganizationError. */
export function toOrganizationError(error: unknown): OrganizationError {
  if (error instanceof OrganizationError) return error;

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
    return new OrganizationError('network', FRIENDLY.network);
  }

  if (code === '23505' || lower.includes('duplicate') || lower.includes('unique')) {
    return new OrganizationError('duplicate', FRIENDLY.duplicate);
  }

  if (code === '23514' || lower.includes('check constraint') || lower.includes('invalid')) {
    return new OrganizationError('invalid_data', FRIENDLY.invalid_data);
  }

  if (status === 401) {
    return new OrganizationError('unauthorized', FRIENDLY.unauthorized);
  }

  if (
    status === 403 ||
    code === '42501' ||
    lower.includes('permission') ||
    lower.includes('row-level security') ||
    lower.includes('rls')
  ) {
    return new OrganizationError('permission_denied', FRIENDLY.permission_denied);
  }

  if (
    status === 404 ||
    code === 'PGRST116' ||
    lower.includes('not found') ||
    lower.includes('0 rows')
  ) {
    return new OrganizationError('not_found', FRIENDLY.not_found);
  }

  if (lower.includes('not configured')) {
    return new OrganizationError('not_configured', FRIENDLY.not_configured);
  }

  return new OrganizationError(
    'unknown',
    isUsableMessage(rawMessage) ? rawMessage.trim() : FRIENDLY.unknown,
  );
}
