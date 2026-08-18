/**
 * MeriBaari — send-push-notification
 *
 * Secure server-side Expo Push delivery.
 * Invoked by Postgres AFTER INSERT on notifications (pg_net) with the service role.
 *
 * Never expose the service role key to the mobile client.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  captureException,
  flushSentry,
  initFunctionSentry,
  maybeHandleSentryTest,
} from '../_shared/sentry.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const PUSH_TYPES = new Set([
  'TICKET_CALLED',
  'TICKET_SERVING',
  'QUEUE_TURN_APPROACHING',
  'QUEUE_PAUSED',
  'QUEUE_RESUMED',
  'QUEUE_CLOSED',
  'TICKET_SERVED',
  'TICKET_SKIPPED',
  'CUSTOMER_JOINED',
  'SUBSCRIPTION_PAYMENT_SUBMITTED',
  'SUBSCRIPTION_APPROVED',
  'SUBSCRIPTION_REJECTED',
]);

interface PushRequestBody {
  notificationId?: string;
  eventKey?: string | null;
  record?: {
    id?: string;
  };
}

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  ticket_id: string | null;
  queue_id: string | null;
  organization_id: string | null;
  event_key: string | null;
}

interface PushTokenRow {
  id: string;
  token: string;
  platform: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
    fault?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  initFunctionSentry('send-push-notification');
  const testResponse = await maybeHandleSentryTest(req, 'send-push-notification');
  if (testResponse) return testResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      captureException(new Error('Push function is missing Supabase env'), {
        functionName: 'send-push-notification',
        feature: 'push',
        tags: { category: 'not_configured' },
      });
      return json({ error: 'Server misconfigured' }, 500);
    }

    if (!isAuthorized(req, serviceRoleKey)) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as PushRequestBody;
    const notificationId = body.notificationId ?? body.record?.id;

    if (!notificationId) {
      return json({ error: 'notificationId is required' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select(
        'id, user_id, title, description, type, ticket_id, queue_id, organization_id, event_key',
      )
      .eq('id', notificationId)
      .maybeSingle();

    if (notificationError) {
      console.error('[send-push] load notification failed');
      return json({ error: 'Failed to load notification' }, 500);
    }

    if (!notification) {
      return json({ error: 'Notification not found', skipped: true }, 404);
    }

    const row = notification as NotificationRow;

    if (!PUSH_TYPES.has(row.type)) {
      return json({ skipped: true, reason: 'type_not_push_eligible' });
    }

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('push')
      .eq('user_id', row.user_id)
      .maybeSingle();

    if (prefs && prefs.push === false) {
      return json({ skipped: true, reason: 'push_disabled' });
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('id, token, platform')
      .eq('user_id', row.user_id)
      .eq('is_active', true);

    if (tokensError) {
      console.error('[send-push] load tokens failed');
      return json({ error: 'Failed to load push tokens' }, 500);
    }

    const activeTokens = (tokens ?? []) as PushTokenRow[];
    console.log('[send-push] active tokens found', {
      notificationId: row.id,
      notificationType: row.type,
      userId: row.user_id,
      activeTokenCount: activeTokens.length,
      platforms: activeTokens.map((t) => t.platform),
    });

    if (activeTokens.length === 0) {
      return json({ skipped: true, reason: 'no_active_tokens' });
    }

    const messages = activeTokens.map((t) => ({
      to: t.token,
      sound: 'default' as const,
      title: row.title,
      body: row.description || '',
      channelId: 'meribaari-queue-alerts',
      priority: 'high' as const,
      data: {
        notificationId: row.id,
        notificationType: row.type,
        ticketId: row.ticket_id,
        queueId: row.queue_id,
        organizationId: row.organization_id,
        eventKey: row.event_key,
      },
    }));

    // Safe request summary — never log `to` (Expo push token values).
    console.log('[send-push] Expo request attempted', {
      url: EXPO_PUSH_URL,
      messageCount: messages.length,
      messages: messages.map((m) => ({
        hasTo: typeof m.to === 'string' && m.to.length > 0,
        sound: m.sound,
        title: m.title,
        bodyLength: m.body.length,
        channelId: m.channelId,
        priority: m.priority,
        dataKeys: Object.keys(m.data),
      })),
    });

    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    console.log('[send-push] Expo HTTP status', {
      status: expoResponse.status,
      ok: expoResponse.ok,
    });

    if (!expoResponse.ok) {
      console.error('[send-push] Expo HTTP error', expoResponse.status);
      captureException(new Error(`Expo push request failed (${expoResponse.status})`), {
        functionName: 'send-push-notification',
        feature: 'push',
        provider: 'expo',
        tags: { status: String(expoResponse.status) },
      });
      return json({ error: 'Expo push request failed' }, 502);
    }

    const expoJson = (await expoResponse.json()) as {
      data?: ExpoPushTicket | ExpoPushTicket[];
    };
    const tickets = normalizeTickets(expoJson.data);
    const invalidTokens: string[] = [];

    console.log('[send-push] Expo tickets parsed', {
      ticketCount: tickets.length,
      tickets: tickets.map((ticket, index) => ({
        index,
        status: ticket.status,
        hasTicketId: typeof ticket.id === 'string' && ticket.id.length > 0,
        message: ticket.message ?? null,
        error: ticket.details?.error ?? null,
        fault: ticket.details?.fault ?? null,
        platform: activeTokens[index]?.platform ?? null,
      })),
    });

    tickets.forEach((ticket, index) => {
      if (ticket.status !== 'error') return;
      const errorCode = ticket.details?.error;
      if (errorCode === 'DeviceNotRegistered' || errorCode === 'InvalidCredentials') {
        const token = activeTokens[index]?.token;
        if (token) {
          invalidTokens.push(token);
          console.log('[send-push] token marked for deactivation', {
            index,
            platform: activeTokens[index]?.platform ?? null,
            reason: errorCode,
            expoMessage: ticket.message ?? null,
            expoFault: ticket.details?.fault ?? null,
          });
        }
      } else {
        console.log('[send-push] Expo ticket error (token kept active)', {
          index,
          platform: activeTokens[index]?.platform ?? null,
          reason: errorCode ?? 'unknown',
          expoMessage: ticket.message ?? null,
          expoFault: ticket.details?.fault ?? null,
        });
      }
    });

    if (invalidTokens.length > 0) {
      const { error: deactivateError } = await supabase.rpc('deactivate_push_tokens_by_values', {
        p_tokens: invalidTokens,
      });
      if (deactivateError) {
        console.error('[send-push] token deactivation failed', {
          attemptedCount: invalidTokens.length,
        });
      } else {
        console.log('[send-push] tokens deactivated', {
          deactivatedCount: invalidTokens.length,
          reasons: tickets
            .map((ticket, index) => ({
              index,
              error: ticket.details?.error ?? null,
            }))
            .filter(
              (item) => item.error === 'DeviceNotRegistered' || item.error === 'InvalidCredentials',
            ),
        });
      }
    } else {
      console.log('[send-push] no tokens deactivated');
    }

    // Touch last_used_at for successful deliveries
    const okTokenIds = activeTokens.filter((_, i) => tickets[i]?.status === 'ok').map((t) => t.id);

    if (okTokenIds.length > 0) {
      await supabase
        .from('push_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .in('id', okTokenIds);
    }

    return json({
      ok: true,
      sent: tickets.filter((t) => t.status === 'ok').length,
      failed: tickets.filter((t) => t.status === 'error').length,
      deactivated: invalidTokens.length,
    });
  } catch (error) {
    console.error('[send-push] unexpected error');
    captureException(error, {
      functionName: 'send-push-notification',
      feature: 'push',
      provider: 'expo',
    });
    return json({ error: 'Internal error' }, 500);
  } finally {
    await flushSentry();
  }
});

function isAuthorized(req: Request, serviceRoleKey: string): boolean {
  const auth = req.headers.get('Authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (bearer && bearer === serviceRoleKey) return true;

  // Also accept apikey header matching service role (Supabase gateway style).
  const apiKey = req.headers.get('apikey') ?? '';
  if (apiKey && apiKey === serviceRoleKey) return true;

  return false;
}

function normalizeTickets(data: ExpoPushTicket | ExpoPushTicket[] | undefined): ExpoPushTicket[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}
