import {
  GeminiRequestError,
  MAX_BURST_RETRY_MS,
  backoffDelayMs,
  logEvent,
  parseRetryAfterMs,
  sleep,
} from './errors.ts';
import type { ReplyStyle } from './reply-style.ts';

const GEMINI_TIMEOUT_MS = 22_000;
const MAX_TOOL_ROUNDS = 3;
/** 5xx/network only. 429 is handled separately and is not retried by default. */
const MAX_GEMINI_ATTEMPTS = 3;
/** Original call + at most one wait if Retry-After is a short burst delay. */
const MAX_RATE_LIMIT_ATTEMPTS = 2;
const TRANSIENT_HTTP = new Set([408, 500, 502, 503, 504]);

/**
 * Default Gemini Developer API model for new API projects.
 * gemini-2.5-flash is closed to new users; 3.6 Flash is the current GA replacement.
 * Override with the GEMINI_MODEL Edge Function secret.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

type GeminiFunctionCall = {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
};

type GeminiPart = {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  thought_signature?: string;
  functionCall?: GeminiFunctionCall;
  function_call?: GeminiFunctionCall;
  functionResponse?: {
    id?: string;
    name: string;
    response: unknown;
  };
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
    finish_reason?: string;
  }>;
  promptFeedback?: { blockReason?: string; block_reason?: string };
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown;
  };
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type ToolDeclaration = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export async function runToolAssistant<TUi>(options: {
  apiKey: string;
  model: string;
  replyStyle: ReplyStyle;
  messages: ChatTurn[];
  ui: TUi;
  requestId: string;
  deadlineAt: number;
  systemInstruction: string;
  toolDeclarations: ToolDeclaration[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}): Promise<{ text: string; ui: TUi }> {
  const contents: GeminiContent[] = options.messages.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }));

  let text = '';

  for (let round = 0; round < MAX_TOOL_ROUNDS + 1; round += 1) {
    throwIfDeadline(options.deadlineAt, options.requestId);

    const body = {
      system_instruction: {
        parts: [{ text: options.systemInstruction }],
      },
      contents,
      tools: [{ functionDeclarations: options.toolDeclarations }],
      generationConfig: {
        maxOutputTokens: 4096,
        thinkingConfig: {
          thinkingLevel: 'low',
        },
      },
    };

    const json = await generateContent({
      apiKey: options.apiKey,
      model: options.model,
      body,
      requestId: options.requestId,
      round,
      deadlineAt: options.deadlineAt,
    });

    const finishReason =
      json.candidates?.[0]?.finishReason ??
      json.candidates?.[0]?.finish_reason ??
      null;
    const blockReason =
      json.promptFeedback?.blockReason ?? json.promptFeedback?.block_reason;

    if (blockReason) {
      logEvent('gemini_blocked', {
        requestId: options.requestId,
        round,
        blockReason,
        model: options.model,
      });
      throw new GeminiRequestError(
        'unknown',
        'The assistant could not complete that request.',
        400,
        false,
      );
    }

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = parts.filter((part) => functionCallName(part));

    if (functionCalls.length === 0) {
      text = parts
        .filter((part) => !part.thought && !functionCallName(part))
        .map((part) => part.text ?? '')
        .join('\n')
        .trim();

      if (!text) {
        logEvent('gemini_empty', {
          requestId: options.requestId,
          round,
          finishReason,
          partCount: parts.length,
          model: options.model,
        });
        throw new GeminiRequestError(
          finishReason === 'MAX_TOKENS' ? 'unavailable' : 'unknown',
          'The assistant returned an empty response.',
          finishReason === 'MAX_TOKENS' ? 503 : 502,
          false,
        );
      }
      break;
    }

    contents.push({
      role: 'model',
      parts,
    });

    const toolParts: GeminiPart[] = [];
    for (const part of functionCalls) {
      throwIfDeadline(options.deadlineAt, options.requestId);
      const call = part.functionCall ?? part.function_call;
      const name = call?.name as string;
      const args = parseArgs(call?.args);
      const toolStarted = Date.now();
      let toolOk = true;
      try {
        const result = await options.executeTool(name, args);
        const responsePart: GeminiPart = {
          functionResponse: {
            name,
            response: asFunctionResponse(result),
          },
        };
        if (call?.id) {
          responsePart.functionResponse!.id = call.id;
        }
        toolParts.push(responsePart);
        if (result && typeof result === 'object' && 'error' in result) {
          toolOk = false;
        }
      } catch (error) {
        toolOk = false;
        logEvent('tool_error', {
          requestId: options.requestId,
          tool: name,
          durationMs: Date.now() - toolStarted,
          reason: error instanceof Error ? error.name : 'unknown',
        });
        toolParts.push({
          functionResponse: {
            name,
            response: { error: 'tool_failed' },
          },
        });
      }
      logEvent('tool_done', {
        requestId: options.requestId,
        tool: name,
        durationMs: Date.now() - toolStarted,
        ok: toolOk,
      });
    }
    contents.push({ role: 'user', parts: toolParts });
  }

  if (!text) {
    throw new GeminiRequestError(
      'unavailable',
      'The assistant could not finish after using tools.',
      503,
      true,
    );
  }

  return { text, ui: options.ui };
}

async function generateContent(options: {
  apiKey: string;
  model: string;
  body: unknown;
  requestId: string;
  round: number;
  deadlineAt: number;
}): Promise<GeminiResponse> {
  let lastError: GeminiRequestError | null = null;

  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt += 1) {
    throwIfDeadline(options.deadlineAt, options.requestId);
    const remaining = options.deadlineAt - Date.now();
    if (remaining < 3_000) {
      throw new GeminiRequestError(
        'timeout',
        'The assistant took too long to respond.',
        408,
        false,
      );
    }

    const timeoutMs = Math.min(GEMINI_TIMEOUT_MS, remaining);
    const started = Date.now();

    try {
      const json = await fetchGeminiOnce({
        apiKey: options.apiKey,
        model: options.model,
        body: options.body,
        timeoutMs,
      });
      const finishReason =
        json.candidates?.[0]?.finishReason ??
        json.candidates?.[0]?.finish_reason ??
        null;
      logEvent('gemini_ok', {
        requestId: options.requestId,
        round: options.round,
        attempt,
        status: 200,
        durationMs: Date.now() - started,
        model: options.model,
        finishReason,
        candidateCount: json.candidates?.length ?? 0,
      });
      return json;
    } catch (error) {
      const mapped = toGeminiError(error);
      lastError = mapped;
      logEvent('gemini_error', {
        requestId: options.requestId,
        round: options.round,
        attempt,
        status: mapped.status ?? null,
        durationMs: Date.now() - started,
        model: options.model,
        category: mapped.category,
        retryable: mapped.retryable,
        retryAfterMs: mapped.retryAfterMs ?? null,
      });

      if (mapped.category === 'rate_limited') {
        const waitMs = mapped.retryAfterMs ?? 0;
        const canBurstRetry =
          waitMs > 0 &&
          waitMs <= MAX_BURST_RETRY_MS &&
          attempt < MAX_RATE_LIMIT_ATTEMPTS &&
          options.deadlineAt - Date.now() > waitMs + 3_000;
        if (!canBurstRetry) {
          throw mapped;
        }
        logEvent('gemini_retry', {
          requestId: options.requestId,
          round: options.round,
          attempt,
          nextAttempt: attempt + 1,
          delayMs: waitMs,
          category: mapped.category,
          reason: 'retry_after',
        });
        await sleep(waitMs);
        continue;
      }

      const shouldRetry =
        mapped.retryable &&
        mapped.category !== 'timeout' &&
        attempt < MAX_GEMINI_ATTEMPTS &&
        options.deadlineAt - Date.now() > 4_000;

      if (!shouldRetry) {
        throw mapped;
      }

      const delay = backoffDelayMs(attempt);
      logEvent('gemini_retry', {
        requestId: options.requestId,
        round: options.round,
        attempt,
        nextAttempt: attempt + 1,
        delayMs: delay,
        category: mapped.category,
      });
      await sleep(delay);
    }
  }

  throw (
    lastError ??
    new GeminiRequestError('unknown', 'AI provider request failed', 502, true)
  );
}

async function fetchGeminiOnce(options: {
  apiKey: string;
  model: string;
  body: unknown;
  timeoutMs: number;
}): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': options.apiKey,
      },
      body: JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    throw toGeminiError(error);
  }
  clearTimeout(timer);

  const json = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    throw fromGeminiHttp(response.status, json, response.headers);
  }

  if (json.error?.message && !json.candidates?.length) {
    throw fromGeminiHttp(json.error.code ?? 502, json, response.headers);
  }

  if (!json.candidates?.length) {
    throw new GeminiRequestError(
      'unavailable',
      'AI provider returned no candidates.',
      503,
      true,
    );
  }

  return json;
}

function fromGeminiHttp(
  status: number,
  json: GeminiResponse,
  headers: Headers,
): GeminiRequestError {
  const providerMessage = json.error?.message ?? '';
  const providerStatus = json.error?.status ?? '';
  const combined = `${providerMessage} ${providerStatus}`.toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    /api key|permission denied|unauthenticated/i.test(combined)
  ) {
    return new GeminiRequestError(
      'not_configured',
      'The assistant is not configured correctly.',
      status,
      false,
    );
  }
  if (status === 404 || /not found|unknown model|unsupported/i.test(combined)) {
    return new GeminiRequestError(
      'not_configured',
      'The assistant model is not available.',
      status,
      false,
    );
  }
  if (status === 400 || status === 422) {
    return new GeminiRequestError(
      'unknown',
      providerMessage || 'The AI provider rejected the request.',
      status,
      false,
    );
  }
  if (status === 429) {
    const retryAfterMs = parseRetryAfterMs(headers, json);
    return new GeminiRequestError(
      'rate_limited',
      'The assistant is temporarily busy. Please try again in a moment.',
      429,
      false,
      retryAfterMs,
    );
  }
  if (TRANSIENT_HTTP.has(status)) {
    return new GeminiRequestError(
      status === 408 ? 'timeout' : 'unavailable',
      providerMessage || 'AI provider request failed',
      status,
      status !== 408,
    );
  }

  return new GeminiRequestError(
    'unknown',
    providerMessage || 'AI provider request failed',
    status,
    false,
  );
}

function toGeminiError(error: unknown): GeminiRequestError {
  if (error instanceof GeminiRequestError) return error;

  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    /timeout|aborted|abort/i.test(message)
  ) {
    return new GeminiRequestError(
      'timeout',
      'The assistant took too long to respond.',
      408,
      false,
    );
  }

  if (/network|fetch|failed to connect|dns|econnreset|unavailable/i.test(message)) {
    return new GeminiRequestError('network', 'Could not reach the AI provider.', undefined, true);
  }

  return new GeminiRequestError(
    'unknown',
    message || 'AI provider request failed',
    undefined,
    false,
  );
}

function throwIfDeadline(deadlineAt: number, requestId: string): void {
  if (Date.now() < deadlineAt) return;
  logEvent('deadline_exceeded', { requestId });
  throw new GeminiRequestError(
    'timeout',
    'The assistant took too long to respond.',
    408,
    false,
  );
}

function functionCallName(part: GeminiPart): string | undefined {
  return part.functionCall?.name ?? part.function_call?.name;
}

function asFunctionResponse(result: unknown): Record<string, unknown> {
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result as Record<string, unknown>;
  }
  return { result };
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}
