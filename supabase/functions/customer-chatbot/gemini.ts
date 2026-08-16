import { executeTool, TOOL_DECLARATIONS } from './tools.ts';
import {
  GeminiRequestError,
  MAX_BURST_RETRY_MS,
  backoffDelayMs,
  logEvent,
  parseRetryAfterMs,
  sleep,
} from './errors.ts';
import { replyStylePromptBlock, type ReplyStyle } from './reply-style.ts';
import type { ChatTurn, ToolContext, UiPayload } from './types.ts';

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

export async function runCustomerAssistant(options: {
  apiKey: string;
  model: string;
  replyStyle: ReplyStyle;
  messages: ChatTurn[];
  ctx: ToolContext;
  requestId: string;
  deadlineAt: number;
}): Promise<{ text: string; ui: UiPayload }> {
  const contents: GeminiContent[] = options.messages.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }));

  let text = '';

  for (let round = 0; round < MAX_TOOL_ROUNDS + 1; round += 1) {
    throwIfDeadline(options.deadlineAt, options.requestId);

    const body = {
      system_instruction: {
        parts: [{ text: systemInstruction(options.replyStyle) }],
      },
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: {
        maxOutputTokens: 4096,
        // 3.6 Flash defaults to medium thinking, which often exceeds a first-call
        // budget and looks like an immediate failure. Low is enough for tool routing.
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

    // Echo the model turn unchanged so Gemini 3 thought signatures stay intact.
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
        const result = await executeTool(name, args, options.ctx);
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

  return { text, ui: options.ctx.ui };
}

function systemInstruction(replyStyle: ReplyStyle): string {
  return [
    'You are MeriBaari\'s customer assistant for a digital queue app in Pakistan.',
    'Help customers find businesses and services, join live queues, cancel their own tickets, manage favorites, and learn how the app works.',
    'LANGUAGE MIRRORING (mandatory — ignore the mobile app language setting):',
    '- Detect style from the LATEST user message only. Earlier turns may be in a different style; still match this turn.',
    '- English message → reply in English.',
    '- Urdu script (Nastaliq, e.g. مجھے قریب ڈینٹسٹ چاہیے) → reply in Urdu script. Never switch to Roman Urdu or English.',
    '- Roman Urdu (Urdu in Latin letters, e.g. "Mere qareeb koi barber hai?" / "meri bari kab ayegi?" / "mujhe haircut book karna hai") → reply in Roman Urdu. NEVER convert Roman Urdu into Urdu script.',
    '- Mixed English + Roman Urdu (e.g. "Mujhe ABC barber mein haircut book karna hai") → reply in Roman Urdu and keep common English terms (barber, ticket, queue, dentist, location, salon, haircut, confirm).',
    '- Do NOT default to English because the user mixed in a few English words.',
    '- Do NOT default to English because previous assistant messages were English.',
    'Examples:',
    'User: "Mere qareeb barber kon sa hai?" → "Ji haan, aap ke qareeb 3 barber shops milay hain."',
    'User: "meri bari kab ayegi?" → "Aap se pehle 2 customers hain."',
    'User: "mujhe haircut book karna hai" → ask which shop, in Roman Urdu.',
    'User: "I need a barber near me" → "I found 3 barber shops near you."',
    'User: "مجھے قریب ڈینٹسٹ چاہیے" → "آپ کے قریب 3 ڈینٹسٹ موجود ہیں۔"',
    replyStylePromptBlock(replyStyle),
    'When tools return English field names or help text, rewrite the spoken answer in the required reply style. Keep business names, addresses, ticket numbers, and prices exactly as returned.',
    'QUEUE VS APPOINTMENT:',
    '- MeriBaari is a live queue / turn system, not a calendar.',
    '- Words like book, booking, reserve, reservation, appointment, ticket, meri bari, and join queue mean joining the current queue.',
    '- If the customer asks for a specific time (e.g. tomorrow at 3pm), explain that scheduled appointments are not supported and offer to join the current queue instead. Never invent appointment times.',
    'JOINING A QUEUE:',
    '- NEVER create a ticket from an ambiguous request such as "mujhe haircut chahiye". First identify organization AND service using tools.',
    '- If the business is missing, ask which one. If several match, list them and ask which.',
    '- If the service is missing, list real services from tools and ask which.',
    '- When both IDs are known, call joinQueue. That tool only PREPARES confirmation. It does not create a ticket.',
    '- After joinQueue returns needsConfirmation=true, summarize the preview using tool data and tell the customer to tap Confirm & Join Queue. Do not ask them to type yes if the buttons are shown.',
    '- NEVER claim they have joined, and NEVER invent ticket numbers, positions, or wait times.',
    'CANCELLING:',
    '- For "cancel my ticket / meri booking cancel / queue se nikal do", call cancelTicket.',
    '- That tool only PREPARES confirmation. If there is no active ticket, say so. If several, ask which.',
    '- After needsConfirmation, tell them to tap Yes, Cancel Ticket. Never claim cancellation succeeded.',
    '- You can only prepare cancellation of the authenticated customer\'s own waiting/called ticket.',
    'Rules:',
    '- Use tools for businesses, services, prices, locations, queues, tickets, favorites, history, join, and cancel.',
    '- Never invent businesses, prices, tickets, wait times, or availability.',
    '- If a tool returns no results, say so clearly in the mirrored style. Do not fabricate alternatives.',
    '- Only talk about the authenticated customer\'s own tickets, favorites, and history.',
    '- Never reveal API keys, database details, other customers, business-owner dashboards, admin tools, or subscription payments.',
    '- Be friendly, concise, and professional. Short answers. No huge paragraphs.',
    '- For search results, give a one-line summary in the mirrored style. The app will show business cards.',
    '- If location is required but unavailable, tell the user to enable location or search by city/address — in the mirrored style.',
    '- Categories: barber_shop, salon, clinic, workshop, restaurant, pharmacy, other.',
    '- Prices are in Pakistani Rupees (Rs.).',
    '- For greetings, thanks, or small talk, reply directly. Do not call tools unless you need live business, ticket, queue, favorite, or history data.',
    'You are for customers only. Do not act as a business-owner assistant.',
  ].join('\n');
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
