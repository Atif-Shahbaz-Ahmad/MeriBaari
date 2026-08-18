/**
 * MeriBaari — customer-chatbot
 *
 * Authenticated customer assistant. Gemini + scoped data tools.
 * Uses the caller's JWT so RLS applies. Never uses the service role for customer data.
 * GEMINI_API_KEY stays in Edge Function secrets — never in the mobile app.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

import {
  AssistantError,
  GeminiRequestError,
  USER_MESSAGE,
  isRetryableCode,
  logEvent,
  type ChatFailureCode,
} from './errors.ts';
import { DEFAULT_GEMINI_MODEL, runCustomerAssistant } from './gemini.ts';
import { detectReplyStyle } from './reply-style.ts';
import {
  actionResponseMessage,
  executeCancelTicket,
  executeJoinQueue,
  parseConfirmedAction,
} from './actions.ts';
import type { ChatLanguage, ChatLocation, ChatTurn, UiPayload } from './types.ts';
import {
  captureException,
  flushSentry,
  initFunctionSentry,
  maybeHandleSentryTest,
  shouldCaptureFailure,
} from '../_shared/sentry.ts';

const MAX_INPUT_LENGTH = 500;
const MAX_TURNS = 12;
/** Stay under typical Edge Function wall-clock limits; client timeout is 55s. */
const REQUEST_DEADLINE_MS = 50_000;
const DEDUPE_TTL_MS = 30_000;

type HandlerResult = {
  status: number;
  body: Record<string, unknown>;
  retryAfterSeconds?: number;
};

const inflightAssistant = new Map<string, Promise<HandlerResult>>();
const recentAssistant = new Map<string, { result: HandlerResult; until: number }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonError('invalid_data', 'Method not allowed', 405);
  }

  initFunctionSentry('customer-chatbot');
  const testResponse = await maybeHandleSentryTest(req, 'customer-chatbot');
  if (testResponse) return testResponse;

  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();
  let geminiModel = DEFAULT_GEMINI_MODEL;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    geminiModel = Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;

    logEvent('request_start', { requestId, model: geminiModel });

    if (!supabaseUrl || !anonKey) {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: 'not_configured',
        reason: 'missing_supabase_env',
      });
      return jsonError('not_configured', USER_MESSAGE.not_configured, 500, false);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return jsonError('unauthorized', USER_MESSAGE.unauthorized, 401, false);
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError('unauthorized', USER_MESSAGE.unauthorized, 401, false);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: 'unavailable',
        reason: 'profile_lookup_failed',
      });
      return jsonError('unavailable', USER_MESSAGE.unavailable, 500, true);
    }

    if (profile?.role !== 'customer') {
      return jsonError('forbidden', USER_MESSAGE.forbidden, 403, false);
    }

    const body = (await req.json().catch(() => ({}))) as {
      messages?: ChatTurn[];
      language?: ChatLanguage | string;
      location?: ChatLocation | null;
      confirmedAction?: unknown;
      clientRequestId?: unknown;
    };
    const messages = normalizeMessages(body.messages);
    if (body.confirmedAction != null && parseConfirmedAction(body.confirmedAction) == null) {
      return jsonError('invalid_data', 'Please confirm the action again.', 400, false);
    }
    const confirmedAction = parseConfirmedAction(body.confirmedAction);

    if (!confirmedAction && !messages.length) {
      return jsonError('invalid_data', 'Please enter a message.', 400, false);
    }

    if (!confirmedAction) {
      const last = messages[messages.length - 1];
      if (last.role !== 'user' || last.content.length > MAX_INPUT_LENGTH) {
        return jsonError(
          'invalid_data',
          `Please keep messages under ${MAX_INPUT_LENGTH} characters.`,
          400,
          false,
        );
      }
    }

    const lastUser = [...messages].reverse().find((turn) => turn.role === 'user');
    const replyStyle = detectReplyStyle(lastUser?.content ?? '');
    logEvent('reply_style', {
      requestId,
      replyStyle,
      model: geminiModel,
      confirmedAction: confirmedAction?.name ?? null,
      clientRequestId: normalizeClientRequestId(body.clientRequestId),
    });

    const location = normalizeLocation(body.location);
    const ui: UiPayload = {};
    const ctx = { supabase, userId: user.id, location, ui, replyStyle };

    if (confirmedAction) {
      const actionStarted = Date.now();
      const result =
        confirmedAction.name === 'joinQueue'
          ? await executeJoinQueue(ctx, {
              organizationId: confirmedAction.organizationId,
              serviceId: confirmedAction.serviceId,
            })
          : await executeCancelTicket(ctx, { ticketId: confirmedAction.ticketId });

      const ok = Boolean(result.created || result.cancelled);
      logEvent('confirmed_action', {
        requestId,
        durationMs: Date.now() - actionStarted,
        action: confirmedAction.name,
        ok,
        error: typeof result.error === 'string' ? result.error : null,
      });
      logEvent('request_ok', {
        requestId,
        durationMs: Date.now() - startedAt,
        model: geminiModel,
        replyStyle,
        hasTicket: Boolean(ui.ticket),
        confirmedAction: confirmedAction.name,
        ok,
      });

      return json({
        message: actionResponseMessage(result, replyStyle),
        cards: ui.cards,
        ticket: ui.ticket,
        favorites: ui.favorites,
        history: ui.history,
        locationRequired: Boolean(ui.locationRequired),
        pendingAction: ui.pendingAction ?? null,
        actionResult: ui.actionResult ?? {
          ok,
          code: typeof result.error === 'string' ? result.error : undefined,
        },
      });
    }

    if (!geminiKey) {
      logEvent('request_failed', {
        requestId,
        durationMs: Date.now() - startedAt,
        category: 'not_configured',
        reason: 'missing_gemini_key',
        model: geminiModel,
      });
      captureException(new Error('Gemini API key is not configured'), {
        functionName: 'customer-chatbot',
        feature: 'chatbot',
        provider: 'gemini',
        tags: { category: 'not_configured' },
      });
      return jsonError('not_configured', USER_MESSAGE.not_configured, 503, false);
    }

    const clientRequestId = normalizeClientRequestId(body.clientRequestId);
    const dedupeKey = clientRequestId ? `${user.id}:${clientRequestId}` : null;
    const payload = await dedupeAssistantRequest(dedupeKey, async () => {
      try {
        const result = await runCustomerAssistant({
          apiKey: geminiKey,
          model: geminiModel,
          replyStyle,
          messages,
          ctx,
          requestId,
          deadlineAt: startedAt + REQUEST_DEADLINE_MS,
        });
        logEvent('request_ok', {
          requestId,
          durationMs: Date.now() - startedAt,
          model: geminiModel,
          replyStyle,
          clientRequestId,
          hasCards: Boolean(result.ui.cards?.length),
          hasTicket: Boolean(result.ui.ticket),
          hasPendingAction: Boolean(result.ui.pendingAction),
          locationRequired: Boolean(result.ui.locationRequired),
        });
        return {
          status: 200,
          body: {
            message: result.text,
            cards: result.ui.cards,
            ticket: result.ui.ticket,
            favorites: result.ui.favorites,
            history: result.ui.history,
            locationRequired: Boolean(result.ui.locationRequired),
            pendingAction: result.ui.pendingAction ?? null,
          },
        };
      } catch (error) {
        const mapped = mapCaughtError(error);
        logEvent('request_failed', {
          requestId,
          durationMs: Date.now() - startedAt,
          category: mapped.code,
          status: mapped.httpStatus,
          retryable: mapped.retryable,
          model: geminiModel,
          clientRequestId,
          retryAfterSeconds: mapped.retryAfterSeconds ?? null,
          reason: error instanceof Error ? error.name : 'unknown',
        });
        if (shouldCaptureFailure(mapped.code)) {
          captureException(error, {
            functionName: 'customer-chatbot',
            feature: 'chatbot',
            provider: error instanceof GeminiRequestError ? 'gemini' : undefined,
            tags: {
              category: mapped.code,
              status: String(mapped.httpStatus),
              ...(error instanceof GeminiRequestError
                ? {
                    geminiCategory: error.category,
                    geminiStatus: String(error.status ?? mapped.httpStatus),
                  }
                : {}),
            },
            extras: {
              retryable: mapped.retryable,
              requestId,
            },
          });
        }
        return {
          status: mapped.httpStatus,
          body: {
            error: mapped.message,
            code: mapped.code,
            retryable: mapped.retryable,
            retryAfterSeconds: mapped.retryAfterSeconds,
          },
          retryAfterSeconds: mapped.retryAfterSeconds,
        };
      }
    });

    return json(payload.body, payload.status, payload.retryAfterSeconds);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const mapped = mapCaughtError(error);
    logEvent('request_failed', {
      requestId,
      durationMs,
      category: mapped.code,
      status: mapped.httpStatus,
      retryable: mapped.retryable,
      model: geminiModel,
      reason: error instanceof Error ? error.name : 'unknown',
    });
    if (shouldCaptureFailure(mapped.code)) {
      captureException(error, {
        functionName: 'customer-chatbot',
        feature: 'chatbot',
        provider: error instanceof GeminiRequestError ? 'gemini' : undefined,
        tags: {
          category: mapped.code,
          status: String(mapped.httpStatus),
        },
        extras: { requestId },
      });
    }
    return jsonError(
      mapped.code,
      mapped.message,
      mapped.httpStatus,
      mapped.retryable,
      mapped.retryAfterSeconds,
    );
  } finally {
    await flushSentry();
  }
});

function mapCaughtError(error: unknown): AssistantError {
  if (error instanceof AssistantError) return error;
  if (error instanceof GeminiRequestError) {
    const code = geminiCategoryToCode(error.category);
    return new AssistantError(
      code,
      USER_MESSAGE[code],
      geminiCategoryToStatus(error.category, error.status),
      error.retryable && isRetryableCode(code),
      toRetryAfterSeconds(error.retryAfterMs),
    );
  }

  const message = error instanceof Error ? error.message : '';
  if (/timeout|aborted/i.test(message)) {
    return new AssistantError('timeout', USER_MESSAGE.timeout, 408, true);
  }
  if (/network|fetch|failed to connect/i.test(message)) {
    return new AssistantError('network', USER_MESSAGE.network, 503, true);
  }
  return new AssistantError('unknown', USER_MESSAGE.unknown, 500, true);
}

function geminiCategoryToCode(category: GeminiRequestError['category']): ChatFailureCode {
  if (category === 'timeout') return 'timeout';
  if (category === 'rate_limited') return 'rate_limited';
  if (category === 'network') return 'network';
  if (category === 'unavailable') return 'unavailable';
  if (category === 'not_configured') return 'not_configured';
  return 'unknown';
}

function geminiCategoryToStatus(
  category: GeminiRequestError['category'],
  status: number | undefined,
): number {
  if (category === 'timeout') return 408;
  if (category === 'rate_limited') return 429;
  if (category === 'not_configured') return 503;
  if (category === 'network' || category === 'unavailable') return 503;
  if (status && status >= 400 && status < 600) return status;
  return 500;
}

function normalizeMessages(raw: ChatTurn[] | undefined): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (turn) =>
        turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string' &&
        turn.content.trim().length > 0,
    )
    .map((turn) => ({
      role: turn.role,
      content: turn.content.trim().slice(0, MAX_INPUT_LENGTH * 2),
    }))
    .slice(-MAX_TURNS);
}

function normalizeLocation(raw: ChatLocation | null | undefined): ChatLocation | null {
  if (!raw || typeof raw !== 'object') return null;
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function json(
  payload: Record<string, unknown>,
  status = 200,
  retryAfterSeconds?: number,
): Response {
  const headers: Record<string, string> = {
    ...(corsHeaders() as Record<string, string>),
    'Content-Type': 'application/json',
  };
  if (retryAfterSeconds != null && retryAfterSeconds > 0) {
    headers['Retry-After'] = String(retryAfterSeconds);
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

function jsonError(
  code: ChatFailureCode,
  message: string,
  status: number,
  retryable = isRetryableCode(code),
  retryAfterSeconds?: number,
): Response {
  return json(
    {
      error: message,
      code,
      retryable,
      retryAfterSeconds,
    },
    status,
    retryAfterSeconds,
  );
}

function normalizeClientRequestId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!/^[A-Za-z0-9._-]{8,80}$/.test(value)) return null;
  return value;
}

function toRetryAfterSeconds(retryAfterMs: number | undefined): number | undefined {
  if (retryAfterMs == null || !Number.isFinite(retryAfterMs) || retryAfterMs <= 0) {
    return undefined;
  }
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

async function dedupeAssistantRequest(
  key: string | null,
  run: () => Promise<HandlerResult>,
): Promise<HandlerResult> {
  if (!key) return run();

  const cached = recentAssistant.get(key);
  if (cached && cached.until > Date.now()) {
    logEvent('request_deduped', { cache: 'recent' });
    return cached.result;
  }

  const existing = inflightAssistant.get(key);
  if (existing) {
    logEvent('request_deduped', { cache: 'inflight' });
    return existing;
  }

  const promise = run()
    .then((result) => {
      if (result.status === 200 || result.status === 429) {
        recentAssistant.set(key, { result, until: Date.now() + DEDUPE_TTL_MS });
      }
      inflightAssistant.delete(key);
      return result;
    })
    .catch((error) => {
      inflightAssistant.delete(key);
      throw error;
    });

  inflightAssistant.set(key, promise);
  return promise;
}
