export type VoiceErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_data'
  | 'no_speech'
  | 'timeout'
  | 'network'
  | 'not_configured'
  | 'rate_limited'
  | 'unavailable'
  | 'permission_denied'
  | 'unsupported_platform'
  | 'tts_unavailable'
  | 'unknown';

export class VoiceError extends Error {
  readonly code: VoiceErrorCode;
  readonly retryable: boolean;

  constructor(code: VoiceErrorCode, message: string, retryable?: boolean) {
    super(message);
    this.name = 'VoiceError';
    this.code = code;
    this.retryable = retryable ?? isVoiceErrorRetryable(code);
    Object.setPrototypeOf(this, VoiceError.prototype);
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

const FRIENDLY: Record<VoiceErrorCode, string> = {
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'Voice is only available for customer and business accounts.',
  invalid_data: 'I could not use that recording. Please try again.',
  no_speech: 'I did not catch that. Please try speaking again.',
  timeout: 'Transcription took too long. Please try again.',
  network: 'Something went wrong while connecting. Please try again.',
  not_configured: 'Voice is not available yet.',
  rate_limited: 'Voice is temporarily busy. Please try again in a moment.',
  unavailable: 'Voice is temporarily unavailable. Please try again in a moment.',
  permission_denied: 'Microphone permission is required to talk to the assistant.',
  unsupported_platform: 'Voice is not available on this device.',
  tts_unavailable: "Voice playback isn't available right now.",
  unknown: 'Something went wrong. Please try again.',
};

const RETRYABLE_CODES: ReadonlySet<VoiceErrorCode> = new Set([
  'no_speech',
  'timeout',
  'network',
  'unavailable',
  'unknown',
  'invalid_data',
  'tts_unavailable',
]);

export function isVoiceErrorRetryable(code: VoiceErrorCode): boolean {
  return RETRYABLE_CODES.has(code);
}

export function getVoiceErrorCopyKey(code: VoiceErrorCode): `voice.errors.${VoiceErrorCode}` {
  return `voice.errors.${code}`;
}

export function getVoiceErrorMessage(error: unknown): string {
  const mapped = toVoiceError(error);
  return FRIENDLY[mapped.code] ?? FRIENDLY.unknown;
}

const TRANSIENT_HTTP = new Set([408, 500, 502, 503, 504, 546, 547]);

export function toVoiceError(error: unknown): VoiceError {
  if (error instanceof VoiceError) return error;

  const status = readStatus(error);
  const payloadCode = readPayloadCode(error);
  const rawMessage =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : undefined;

  if (payloadCode && isVoiceErrorCode(payloadCode)) {
    return new VoiceError(payloadCode, FRIENDLY[payloadCode]);
  }

  const token = `${payloadCode ?? ''} ${rawMessage ?? ''}`.toLowerCase();
  if (status === 401) return new VoiceError('unauthorized', FRIENDLY.unauthorized, false);
  if (status === 403) return new VoiceError('forbidden', FRIENDLY.forbidden, false);
  if (status === 429) return new VoiceError('rate_limited', FRIENDLY.rate_limited, false);
  if (status === 408 || /timeout|aborted/i.test(token)) {
    return new VoiceError('timeout', FRIENDLY.timeout);
  }
  if (payloadCode === 'no_speech' || /no.?speech|empty transcript/i.test(token)) {
    return new VoiceError('no_speech', FRIENDLY.no_speech);
  }
  if (
    payloadCode === 'not_configured' ||
    /not configured|api key|deepgram|azure/i.test(token)
  ) {
    return new VoiceError('not_configured', FRIENDLY.not_configured, false);
  }
  if (payloadCode === 'tts_unavailable' || /playback isn't available|tts/i.test(token)) {
    return new VoiceError('tts_unavailable', FRIENDLY.tts_unavailable);
  }
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 546 ||
    payloadCode === 'unavailable'
  ) {
    return new VoiceError('unavailable', FRIENDLY.unavailable);
  }
  if (/network request failed|failed to fetch|failed to connect|network error/i.test(token)) {
    return new VoiceError('network', FRIENDLY.network);
  }
  if (status === 400) return new VoiceError('invalid_data', FRIENDLY.invalid_data);
  if (TRANSIENT_HTTP.has(status ?? -1)) {
    return new VoiceError('unavailable', FRIENDLY.unavailable);
  }
  return new VoiceError('unknown', FRIENDLY.unknown);
}

function isVoiceErrorCode(value: string): value is VoiceErrorCode {
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

function readPayloadCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const direct = (error as { payloadCode?: unknown }).payloadCode;
  if (typeof direct === 'string' && direct) return direct;
  if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  return undefined;
}
