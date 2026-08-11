/**
 * Domain errors for queues, entries, and tickets.
 */
export type QueueErrorCode =
  | 'not_found'
  | 'unauthorized'
  | 'permission_denied'
  | 'invalid_data'
  | 'already_joined'
  | 'queue_paused'
  | 'queue_closed'
  | 'queue_unavailable'
  | 'service_inactive'
  | 'organization_inactive'
  | 'department_inactive'
  | 'no_customers_waiting'
  | 'already_served'
  | 'cannot_cancel'
  | 'network'
  | 'not_configured'
  | 'unknown';

export class QueueError extends Error {
  readonly code: QueueErrorCode;
  /** When already joined, the existing ticket id. */
  readonly existingTicketId?: string;

  constructor(
    code: QueueErrorCode,
    message: string,
    existingTicketId?: string,
  ) {
    super(message);
    this.name = 'QueueError';
    this.code = code;
    this.existingTicketId = existingTicketId;
    Object.setPrototypeOf(this, QueueError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<QueueErrorCode, string> = {
  not_found: 'Queue or ticket not found.',
  unauthorized: 'Please sign in to continue.',
  permission_denied: 'You do not have permission to manage this queue.',
  invalid_data: 'Please check the details and try again.',
  already_joined: 'You are already in this queue.',
  queue_paused: 'This queue is paused. Please try again later.',
  queue_closed: 'This queue is closed.',
  queue_unavailable: 'This queue is not available right now.',
  service_inactive: 'This service is not available.',
  organization_inactive: 'This organization is not accepting customers.',
  department_inactive: 'This department is not available.',
  no_customers_waiting: 'No customers are waiting.',
  already_served: 'This ticket has already been served.',
  cannot_cancel: 'This ticket can no longer be cancelled.',
  network: 'Network error. Check your connection and try again.',
  not_configured: 'Queue system is not configured yet.',
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

export function getQueueErrorMessage(error: unknown): string {
  if (error instanceof QueueError) {
    if (error.code === 'already_joined') return FRIENDLY.already_joined;
    if (isUsableMessage(error.message)) return error.message.trim();
    return FRIENDLY[error.code] ?? FRIENDLY.unknown;
  }
  if (error instanceof Error && isUsableMessage(error.message)) {
    const mapped = mapRpcMessage(error.message);
    if (mapped) return FRIENDLY[mapped] ?? error.message.trim();
    return error.message.trim();
  }
  if (typeof error === 'string' && isUsableMessage(error)) {
    return error.trim();
  }
  return FRIENDLY.unknown;
}

function mapRpcMessage(raw: string): QueueErrorCode | null {
  const upper = raw.toUpperCase();
  if (upper.includes('ALREADY_JOINED')) return 'already_joined';
  if (upper.includes('QUEUE_PAUSED')) return 'queue_paused';
  if (upper.includes('QUEUE_CLOSED')) return 'queue_closed';
  if (upper.includes('QUEUE_UNAVAILABLE')) return 'queue_unavailable';
  if (upper.includes('SERVICE_INACTIVE')) return 'service_inactive';
  if (upper.includes('ORGANIZATION_INACTIVE')) return 'organization_inactive';
  if (upper.includes('DEPARTMENT_INACTIVE')) return 'department_inactive';
  if (upper.includes('NO_CUSTOMERS_WAITING')) return 'no_customers_waiting';
  if (upper.includes('ALREADY_SERVED')) return 'already_served';
  if (upper.includes('CANNOT_CANCEL')) return 'cannot_cancel';
  if (upper.includes('PERMISSION_DENIED')) return 'permission_denied';
  if (upper.includes('UNAUTHORIZED')) return 'unauthorized';
  if (upper.includes('NOT_FOUND') || upper.includes('TICKET_NOT_FOUND')) {
    return 'not_found';
  }
  return null;
}

export function toQueueError(error: unknown): QueueError {
  if (error instanceof QueueError) return error;

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
  const mapped = mapRpcMessage(rawMessage);

  if (mapped === 'already_joined') {
    const match = rawMessage.match(/ALREADY_JOINED:([0-9a-f-]{36})/i);
    return new QueueError(
      'already_joined',
      FRIENDLY.already_joined,
      match?.[1],
    );
  }

  if (mapped) {
    return new QueueError(mapped, FRIENDLY[mapped]);
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('offline') ||
    lower.includes('timeout') ||
    status === 504 ||
    status === 502 ||
    status === 503
  ) {
    return new QueueError('network', FRIENDLY.network);
  }

  if (status === 401) {
    return new QueueError('unauthorized', FRIENDLY.unauthorized);
  }

  if (
    status === 403 ||
    code === '42501' ||
    lower.includes('permission') ||
    lower.includes('row-level security') ||
    lower.includes('rls')
  ) {
    return new QueueError('permission_denied', FRIENDLY.permission_denied);
  }

  if (
    status === 404 ||
    code === 'PGRST116' ||
    lower.includes('not found') ||
    lower.includes('0 rows')
  ) {
    return new QueueError('not_found', FRIENDLY.not_found);
  }

  return new QueueError(
    'unknown',
    isUsableMessage(rawMessage) ? rawMessage.trim() : FRIENDLY.unknown,
  );
}
