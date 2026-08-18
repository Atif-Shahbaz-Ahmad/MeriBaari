# MeriBaari Supabase Backend

SQL migrations and generated database types live here.

## Status

**Auth + Profiles + Organizations + Departments + Services + Queues/Tickets + Realtime + Notifications + Push** use Supabase when `EXPO_PUBLIC_SUPABASE_*` is set.

## Auth email (development)

Use the **default Supabase Auth email provider** for development and testing.

Do **not** configure custom SMTP, Resend, or branded email templates at this stage.

## Queue system

Concurrency-safe RPCs (migration `20260808000008_queue_system.sql`):

| Function                 | Purpose                             |
| ------------------------ | ----------------------------------- |
| `get_queue_join_preview` | Confirm-screen snapshot (no ticket) |
| `join_queue`             | Atomically create entry + ticket    |
| `cancel_my_ticket`       | Customer cancel                     |
| `call_next_customer`     | Business call next (SKIP LOCKED)    |
| `start_serving_customer` | Mark serving                        |
| `serve_customer`         | Mark served                         |
| `skip_customer`          | Skip + optionally call next         |
| `set_queue_status`       | Pause / resume / close              |

## Realtime

Migration `20260808000009_queue_realtime.sql` publishes `queues`, `queue_entries`, `tickets`.

Migration `20260808000010_notifications_system.sql` also publishes `notifications`.

## Notifications

Migration `20260808000010_notifications_system.sql`:

- Enriches `notifications` with `ticket_id`, `queue_id`, `organization_id`, `read_at`, `event_key`
- Strongly typed `notification_type` enum (`QUEUE_JOINED`, `TICKET_CALLED`, …)
- Idempotent `create_notification(...)` (SECURITY DEFINER)
- Queue RPCs emit in-app notifications server-side
- Turn-approaching when `peopleAhead <= 2` (once per ticket via `event_key`)
- RLS: users read/update/delete own rows only; client INSERT denied
- `notification_preferences` prepared (`in_app` default true; push/email/whatsapp false)

Client: `SupabaseNotificationRepository` → `NotificationService` → React Query + Realtime.

## Push notifications

Migration `20260808000011_push_notifications.sql` + Edge Function `send-push-notification`:

- `push_tokens` table (unique `token`, multi-device per user, RLS own-rows only)
- Client registers Expo push tokens via `register_push_token` RPC
- Logout soft-deactivates the current device token (`deactivate_push_token`)
- After in-app notification INSERT, a trigger dispatches to the Edge Function via `pg_net`
- Edge Function sends through Expo Push Service and deactivates invalid tokens
- Push types: `TICKET_CALLED`, `TICKET_SERVING`, `QUEUE_TURN_APPROACHING`, `QUEUE_PAUSED`, `QUEUE_RESUMED`, `QUEUE_CLOSED`, `TICKET_SERVED`, `TICKET_SKIPPED`

### Configure push dispatch secrets

The database trigger needs a service role key to call the Edge Function. Prefer Vault:

```sql
select vault.create_secret('https://YOUR_PROJECT.supabase.co', 'supabase_url');
select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
```

Local Docker fallback URL is `http://kong:8000` when Vault is empty — you still must provide `service_role_key`.

Deploy the function:

```bash
npx supabase functions deploy send-push-notification
```

Test push on a **physical Android device** (or a native development build). Expo Go may not behave the same as a production/dev client for push.

Do **not** put the service role key in the React Native app, `app.json`, or client env files.

## Customer chatbot

Edge Function `customer-chatbot` (JWT required, customer role only):

- Mobile app calls `supabase.functions.invoke('customer-chatbot')` with the user session
- Gemini API key stays in Edge Function secrets — never in Expo public env
- Tools query organizations, services, tickets, favorites, and history with the caller's JWT (RLS)

```bash
npx supabase secrets set GEMINI_API_KEY=your_key
npx supabase functions deploy customer-chatbot
```

Optional (defaults to `gemini-3.6-flash` if unset):

```bash
npx supabase secrets set GEMINI_MODEL=gemini-3.6-flash
```

Do not set `GEMINI_MODEL` to `gemini-2.5-flash` — that model is closed to new Gemini API users.

## Business chatbot

Edge Function `business-chatbot` (JWT required, `profiles.role = business` only):

- Mobile app calls `supabase.functions.invoke('business-chatbot')` with the owner session
- Same `GEMINI_API_KEY` / `GEMINI_MODEL` secrets as the customer assistant
- Tools and RPCs are scoped to `organizations.owner_id = auth.uid()`
- Customers and admins receive HTTP 403
- Queue mutations reuse `call_next_customer`, `serve_customer`, `skip_customer`, and `set_queue_status`

```bash
npx supabase functions deploy business-chatbot
```

## Voice transcribe

Edge Function `voice-transcribe` (JWT required, `profiles.role` must be `customer` or `business`):

- Mobile app records locally with `expo-audio`, then calls `supabase.functions.invoke('voice-transcribe')`
- Deepgram API key stays in Edge Function secrets — never in Expo public env
- Returns a transcript only. The app then sends that text through `customer-chatbot` or `business-chatbot`
- Does **not** call Gemini and does **not** store audio

```bash
npx supabase secrets set DEEPGRAM_API_KEY=your_key
npx supabase functions deploy voice-transcribe
```

Optional (defaults to `nova-3`):

```bash
npx supabase secrets set DEEPGRAM_STT_MODEL=nova-3
```

A native rebuild is required after adding `expo-audio` (microphone permission plugin).

## Voice speak (TTS)

Edge Function `voice-speak` (JWT required, `profiles.role` must be `customer` or `business`):

- After the existing chatbot returns a text reply, the app calls `supabase.functions.invoke('voice-speak')` with `{ text, replyStyle }`
- English → Deepgram Aura-2. Urdu script / Roman Urdu → Azure `ur-PK` (Roman Urdu is transliterated server-side)
- Does **not** call Gemini and does **not** store generated audio
- TTS failure never fails the chatbot text reply

```bash
npx supabase secrets set DEEPGRAM_API_KEY=your_key
npx supabase secrets set AZURE_SPEECH_KEY=your_key
npx supabase secrets set AZURE_SPEECH_REGION=your_region
npx supabase functions deploy voice-speak
```

Optional:

```bash
npx supabase secrets set AZURE_SPEECH_VOICE=ur-PK-UzmaNeural
npx supabase secrets set DEEPGRAM_TTS_MODEL=aura-2-thalia-en
```

Do not put these keys in Expo `.env`, `EXPO_PUBLIC_*`, `app.json`, or React Native code.

## Sentry

Edge Functions report provider failures to the `meribaari-functions` Sentry project. Set the functions DSN as a secret (never in client env):

```bash
npx supabase secrets set SENTRY_DSN=YOUR_FUNCTIONS_DSN
npx supabase secrets set SENTRY_ENVIRONMENT=production
```

See `docs/sentry.md`.

## Applying migrations

```bash
npx supabase db push
```

## Regenerating types

```bash
npx supabase gen types typescript --project-id <project-id> > supabase/types/database.ts
```
