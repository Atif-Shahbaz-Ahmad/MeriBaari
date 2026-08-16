import type {
  ChatOwnerHistoryCard,
  ChatPendingAction,
  ChatStatsCard,
  ChatbotConfirmActionInput,
  ChatbotSendInput,
  ChatbotSendResult,
} from '@/domain/models/chatbot';
import type { ChatbotRepository } from '@/domain/repositories/chatbot.repository';
import {
  ChatbotError,
  isTransientChatbotFailure,
  toChatbotError,
  type ChatbotErrorCode,
} from '@/domain/errors/chatbot-error';
import {
  CHATBOT_MAX_TRANSIENT_ATTEMPTS,
  CHATBOT_REQUEST_TIMEOUT_MS,
} from '@/domain/services/chatbot.service';
import { requireSupabase } from '@/lib/supabase';

type FunctionErrorPayload = {
  error?: string;
  code?: string;
  retryable?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(failedAttempt: number): number {
  const base = failedAttempt <= 1 ? 400 : 400 * 2 ** Math.min(failedAttempt - 1, 3);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(2_000, base + jitter);
}

/**
 * Invokes the business-chatbot Edge Function with the signed-in owner's JWT.
 * API keys stay server-side; this client only uses the public anon key + session.
 */
export class SupabaseBusinessChatbotRepository implements ChatbotRepository {
  async send(input: ChatbotSendInput): Promise<ChatbotSendResult> {
    let lastError: ChatbotError | null = null;

    for (let attempt = 1; attempt <= CHATBOT_MAX_TRANSIENT_ATTEMPTS; attempt += 1) {
      const started = Date.now();
      try {
        return await this.invokeOnce(input);
      } catch (error) {
        const mapped = toChatbotError(error);
        lastError = mapped;
        const elapsed = Date.now() - started;
        const canRetry =
          attempt < CHATBOT_MAX_TRANSIENT_ATTEMPTS &&
          isTransientChatbotFailure(mapped) &&
          elapsed < 10_000;

        if (!canRetry) {
          throw mapped;
        }

        await sleep(backoffDelayMs(attempt));
      }
    }

    throw lastError ?? new ChatbotError('unknown', 'Something went wrong. Please try again.');
  }

  async confirmAction(input: ChatbotConfirmActionInput): Promise<ChatbotSendResult> {
    return this.invokeOnce({
      messages: input.messages,
      language: input.language,
      location: input.location,
      confirmedAction: input.action,
    });
  }

  private async invokeOnce(input: ChatbotSendInput): Promise<ChatbotSendResult> {
    const supabase = requireSupabase();
    const controller = new AbortController();
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const invoke = supabase.functions.invoke<ChatbotSendResult | FunctionErrorPayload>(
      'business-chatbot',
      {
        body: input,
        signal: controller.signal,
      },
    );

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(
          new ChatbotError(
            'timeout',
            'The assistant took too long to respond. Please try again.',
          ),
        );
      }, CHATBOT_REQUEST_TIMEOUT_MS);
    });

    try {
      const { data, error } = await Promise.race([invoke, timeout]);

      if (error) {
        throw functionInvokeError(error, data);
      }

      return parseSuccess(data);
    } catch (error) {
      if (timedOut || controller.signal.aborted) {
        throw new ChatbotError(
          'timeout',
          'The assistant took too long to respond. Please try again.',
        );
      }
      throw toChatbotError(error);
    } finally {
      if (timer) clearTimeout(timer);
      void invoke.catch(() => undefined);
    }
  }
}

function parseSuccess(data: ChatbotSendResult | FunctionErrorPayload | null): ChatbotSendResult {
  if (!data || typeof data !== 'object') {
    throw new ChatbotError('unknown', 'Something went wrong. Please try again.');
  }

  if ('error' in data && typeof data.error === 'string' && data.error) {
    throw fromPayload(data, undefined);
  }

  const result = data as ChatbotSendResult;
  if (typeof result.message !== 'string' || !result.message.trim()) {
    throw new ChatbotError('unknown', 'Something went wrong. Please try again.');
  }

  return {
    message: result.message.trim(),
    queueStatus: Array.isArray(result.queueStatus) ? result.queueStatus : undefined,
    waiting: Array.isArray(result.waiting) ? result.waiting : undefined,
    services: Array.isArray(result.services) ? result.services : undefined,
    stats: parseStats(result.stats),
    ownerHistory: parseOwnerHistory(result.ownerHistory ?? (result.history as unknown)),
    pendingAction: parsePendingAction(result.pendingAction),
    actionResult: parseActionResult(result.actionResult),
  };
}

function parseStats(raw: ChatStatsCard | undefined): ChatStatsCard | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return {
    period: typeof raw.period === 'string' ? raw.period : 'today',
    customers: Number(raw.customers ?? 0),
    served: Number(raw.served ?? 0),
    skipped: Number(raw.skipped ?? 0),
    cancelled: Number(raw.cancelled ?? 0),
    waiting: Number(raw.waiting ?? 0),
  };
}

function parseOwnerHistory(raw: unknown): ChatOwnerHistoryCard[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: ChatOwnerHistoryCard[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const item = row as ChatOwnerHistoryCard;
    if (typeof item.id !== 'string') continue;
    items.push({
      id: item.id,
      ticketNumber: typeof item.ticketNumber === 'string' ? item.ticketNumber : '',
      serviceName: typeof item.serviceName === 'string' ? item.serviceName : '',
      departmentName: typeof item.departmentName === 'string' ? item.departmentName : '',
      status: typeof item.status === 'string' ? item.status : '',
      visitedAt: typeof item.visitedAt === 'string' ? item.visitedAt : '',
    });
  }
  return items;
}

function parseActionResult(
  raw: ChatbotSendResult['actionResult'],
): ChatbotSendResult['actionResult'] {
  if (!raw || typeof raw !== 'object') return undefined;
  return {
    ok: raw.ok === true,
    code: typeof raw.code === 'string' ? raw.code : undefined,
  };
}

function parsePendingAction(raw: ChatPendingAction | null | undefined): ChatPendingAction | null {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type;
  if (type !== 'skip_customer' && type !== 'close_queue') return null;
  const organizationId = typeof raw.organizationId === 'string' ? raw.organizationId : '';
  const organizationName =
    typeof raw.organizationName === 'string' ? raw.organizationName : '';
  if (!organizationId || !organizationName) return null;
  const labels = raw.labels;
  const confirm =
    labels && typeof labels.confirm === 'string' && labels.confirm.trim()
      ? labels.confirm.trim()
      : type === 'skip_customer'
        ? 'Yes, skip customer'
        : 'Yes, close queue';
  const dismiss =
    labels && typeof labels.dismiss === 'string' && labels.dismiss.trim()
      ? labels.dismiss.trim()
      : 'Cancel';
  return {
    type,
    status: 'pending',
    organizationId,
    organizationName,
    serviceId: typeof raw.serviceId === 'string' ? raw.serviceId : null,
    serviceName: typeof raw.serviceName === 'string' ? raw.serviceName : '',
    ticketId: typeof raw.ticketId === 'string' ? raw.ticketId : null,
    ticketNumber: typeof raw.ticketNumber === 'string' ? raw.ticketNumber : null,
    entryId: typeof raw.entryId === 'string' ? raw.entryId : null,
    queueId: typeof raw.queueId === 'string' ? raw.queueId : null,
    waitingCount: typeof raw.waitingCount === 'number' ? raw.waitingCount : null,
    estimatedWaitMinutes:
      typeof raw.estimatedWaitMinutes === 'number' ? raw.estimatedWaitMinutes : null,
    queueStatus: typeof raw.queueStatus === 'string' ? raw.queueStatus : null,
    labels: { confirm, dismiss },
  };
}

function functionInvokeError(
  error: unknown,
  data: ChatbotSendResult | FunctionErrorPayload | null,
): ChatbotError {
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return fromPayload(data, readHttpStatus(error));
  }
  const payload = readNestedPayload(error);
  if (payload) {
    return fromPayload(payload, readHttpStatus(error));
  }

  const status = readHttpStatus(error);
  const mapped = toChatbotError(Object.assign(error instanceof Error ? error : new Error(), { status }));
  if (status === 401) return new ChatbotError('unauthorized', mapped.message, false);
  if (status === 403) return new ChatbotError('forbidden', mapped.message, false);
  if (status === 429) {
    return new ChatbotError(
      'rate_limited',
      'The assistant is temporarily busy. Please try again in a moment.',
      false,
    );
  }
  return mapped;
}

function fromPayload(payload: FunctionErrorPayload, status: number | undefined): ChatbotError {
  const code = normalizeCode(payload.code, status);
  const retryable =
    code === 'rate_limited'
      ? false
      : typeof payload.retryable === 'boolean'
        ? payload.retryable
        : undefined;
  return new ChatbotError(
    code,
    typeof payload.error === 'string' && payload.error.trim()
      ? payload.error.trim()
      : 'Something went wrong. Please try again.',
    retryable,
  );
}

function normalizeCode(raw: string | undefined, status: number | undefined): ChatbotErrorCode {
  if (
    raw === 'unauthorized' ||
    raw === 'forbidden' ||
    raw === 'invalid_data' ||
    raw === 'timeout' ||
    raw === 'network' ||
    raw === 'not_configured' ||
    raw === 'rate_limited' ||
    raw === 'unavailable' ||
    raw === 'unknown'
  ) {
    return raw;
  }
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status === 502 || status === 503 || status === 504 || status === 546) {
    return 'unavailable';
  }
  return 'unknown';
}

function readHttpStatus(error: unknown): number | undefined {
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

function readNestedPayload(error: unknown): FunctionErrorPayload | null {
  if (!error || typeof error !== 'object') return null;
  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== 'object') return null;
  if ('error' in context || 'code' in context) {
    return context as FunctionErrorPayload;
  }
  return null;
}
