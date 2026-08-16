export type ChatbotErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_data'
  | 'timeout'
  | 'network'
  | 'not_configured'
  | 'rate_limited'
  | 'unavailable'
  | 'unknown';

export class ChatbotError extends Error {
  readonly code: ChatbotErrorCode;
  readonly retryable: boolean;

  constructor(code: ChatbotErrorCode, message: string, retryable?: boolean) {
    super(message);
    this.name = 'ChatbotError';
    this.code = code;
    this.retryable = retryable ?? isChatbotErrorRetryable(code);
    Object.setPrototypeOf(this, ChatbotError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<ChatbotErrorCode, string> = {
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'The customer assistant is only available for customer accounts.',
  invalid_data: 'Please enter a shorter message and try again.',
  timeout: 'The assistant took too long to respond. Please try again.',
  network: 'Something went wrong while connecting. Please try again.',
  not_configured: 'The assistant is not available yet.',
  rate_limited: 'The assistant is temporarily busy. Please try again in a moment.',
  unavailable: 'The assistant is temporarily unavailable. Please try again in a moment.',
  unknown: 'Something went wrong. Please try again.',
};

const RETRYABLE_CODES: ReadonlySet<ChatbotErrorCode> = new Set([
  'timeout',
  'network',
  'unavailable',
  'unknown',
]);

export function isChatbotErrorRetryable(code: ChatbotErrorCode): boolean {
  return RETRYABLE_CODES.has(code);
}

export function getChatbotErrorCopyKey(code: ChatbotErrorCode): `chatbot.errors.${ChatbotErrorCode}` {
  return `chatbot.errors.${code}`;
}

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

export function getChatbotErrorMessage(error: unknown): string {
  const mapped = toChatbotError(error);
  if (mapped.code === 'invalid_data' && isUsableMessage(mapped.message)) {
    return mapped.message.trim();
  }
  return FRIENDLY[mapped.code] ?? FRIENDLY.unknown;
}

const TRANSIENT_HTTP = new Set([408, 429, 500, 502, 503, 504, 546, 547]);

export function isTransientChatbotFailure(error: unknown): boolean {
  const mapped = toChatbotError(error);
  if (!mapped.retryable) return false;
  if (mapped.code === 'timeout' || mapped.code === 'rate_limited') return false;
  return true;
}

export function toChatbotError(error: unknown): ChatbotError {
  if (error instanceof ChatbotError) return error;

  const status = readStatus(error);
  const code = readCode(error);
  const payloadCode = readPayloadCode(error);
  const rawMessage =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : undefined;

  const mappedCode = mapToCode(status, code, payloadCode, rawMessage);
  return new ChatbotError(mappedCode, FRIENDLY[mappedCode]);
}

function mapToCode(
  status: number | undefined,
  code: string | undefined,
  payloadCode: string | undefined,
  rawMessage: string | undefined,
): ChatbotErrorCode {
  const token = `${payloadCode ?? ''} ${code ?? ''} ${rawMessage ?? ''}`.toLowerCase();

  if (payloadCode && isChatbotErrorCode(payloadCode)) {
    return payloadCode;
  }
  if (status === 401 || code === '401' || payloadCode === 'unauthorized') {
    return 'unauthorized';
  }
  if (status === 403 || code === '403' || payloadCode === 'forbidden') {
    return 'forbidden';
  }
  if (status === 429 || payloadCode === 'rate_limited') {
    return 'rate_limited';
  }
  if (status === 408 || payloadCode === 'timeout' || /timeout|aborted/i.test(token)) {
    return 'timeout';
  }
  if (
    payloadCode === 'not_configured' ||
    /not configured|api key|unknown model/i.test(token)
  ) {
    return 'not_configured';
  }
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 546 ||
    status === 547 ||
    payloadCode === 'unavailable' ||
    /relay|worker|boot/i.test(token)
  ) {
    return 'unavailable';
  }
  if (
    payloadCode === 'network' ||
    /network request failed|failed to fetch|failed to connect|network error/i.test(token)
  ) {
    return 'network';
  }
  if (status === 400 || payloadCode === 'invalid_data') {
    return 'invalid_data';
  }
  if (TRANSIENT_HTTP.has(status ?? -1)) {
    return 'unavailable';
  }
  return 'unknown';
}

function isChatbotErrorCode(value: string): value is ChatbotErrorCode {
  return value in FRIENDLY;
}

function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('status' in error) {
    const status = Number((error as { status: unknown }).status);
    if (Number.isFinite(status) && status > 0) return status;
  }
  if ('context' in error) {
    const context = (error as { context?: { status?: unknown } }).context;
    const status = Number(context?.status);
    if (Number.isFinite(status) && status > 0) return status;
  }
  return undefined;
}

function readCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  const code = (error as { code: unknown }).code;
  return typeof code === 'string' || typeof code === 'number' ? String(code) : undefined;
}

function readPayloadCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const direct = (error as { payloadCode?: unknown }).payloadCode;
  if (typeof direct === 'string' && direct) return direct;
  return undefined;
}
