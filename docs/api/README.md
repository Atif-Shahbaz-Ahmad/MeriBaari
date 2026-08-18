# MeriBaari HTTP API documentation

OpenAPI 3.1 for the **existing** backend HTTP endpoints. There is no Express or NestJS
app, and this folder does not add one.

| File                                           | Purpose                                       |
| ---------------------------------------------- | --------------------------------------------- |
| [`../../openapi.yaml`](../../openapi.yaml)     | Machine-readable spec (source of truth)       |
| [`index.html`](./index.html)                   | Static Swagger UI                             |
| [`swagger-config.yaml`](./swagger-config.yaml) | Swagger UI settings (Bearer JWT + Try it out) |

## View Swagger UI

From the **repository root** (so `/openapi.yaml` is served):

```bash
npx --yes http-server . -p 4173 -c-1 -o /docs/api/index.html
```

Then open `http://127.0.0.1:4173/docs/api/index.html`.

In **Authorize**:

1. `supabaseUserJwt` — paste a signed-in user's access token only (`session.access_token`). Prefix is added as `Bearer`.
2. `supabaseAnonKey` — paste the public anon key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) into the `apikey` header scheme.

Do **not** paste `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`, or `AZURE_SPEECH_KEY`.

Set the server to your hosted project (`https://YOUR_PROJECT.supabase.co`) before Try it out.

## Authentication (existing behavior)

| Endpoint                                    | Public?        | Required credential                            | Extra authorization                               |
| ------------------------------------------- | -------------- | ---------------------------------------------- | ------------------------------------------------- |
| `POST /functions/v1/customer-chatbot`       | No             | User JWT + anon `apikey`                       | `profiles.role = customer`                        |
| `POST /functions/v1/business-chatbot`       | No             | User JWT + anon `apikey`                       | `profiles.role = business`                        |
| `POST /functions/v1/voice-transcribe`       | No             | User JWT + anon `apikey`                       | role `customer` or `business`                     |
| `POST /functions/v1/voice-speak`            | No             | User JWT + anon `apikey`                       | role `customer` or `business`                     |
| `POST /functions/v1/send-push-notification` | No             | Service-role bearer (or matching `apikey`)     | Database trigger only; clients must not call this |
| `GET /auth/v1/health`                       | Yes (anon key) | Anon `apikey` (often also sent as Bearer anon) | No user session                                   |

Gateway `verify_jwt` is **true** on the four client functions and **false** on `send-push-notification`. That function still rejects anything that is not the service role.

Typical client headers for the JWT functions (what `supabase.functions.invoke` sends):

```http
Authorization: Bearer <user access_token>
apikey: <anon key>
Content-Type: application/json
```

## Clients that call these HTTP APIs

- **Mobile + web:** `customer-chatbot`, `business-chatbot`, `voice-transcribe`, `voice-speak`
- **Mobile + web + desktop:** `GET /auth/v1/health` (and fallback `GET /rest/v1/`)
- **Postgres `pg_net` only:** `send-push-notification`

## Not documented as custom HTTP paths

The apps also use **Supabase Auth (GoTrue)**, **PostgREST tables**, **PostgREST RPCs**, **Realtime**, and **Storage**. Those are platform HTTP surfaces, not MeriBaari Edge Functions. Inventing duplicate REST/RPC paths in `openapi.yaml` would misrepresent the backend.

See [RPC and database inventory](#rpc-and-database-operations-not-custom-http-apis) below.

## Validate the spec

From the repository root:

```bash
npx --yes @redocly/cli lint openapi.yaml
```

## RPC and database operations (not custom HTTP APIs)

These are used by mobile, web, and desktop through `@supabase/supabase-js`. PostgREST _can_ expose them as `POST /rest/v1/rpc/{name}` or table CRUD on `/rest/v1/{table}`, but they are **database operations with RLS**, not MeriBaari Edge Functions. They are omitted from `openapi.yaml` on purpose.

### Client-called RPCs (`authenticated` JWT)

| RPC                                 | Callers                                     | Purpose                                 |
| ----------------------------------- | ------------------------------------------- | --------------------------------------- |
| `get_queue_join_preview`            | Customer ticket UI; customer chatbot        | Confirm-screen snapshot (no ticket)     |
| `join_queue`                        | Customer ticket UI; customer chatbot        | Atomically create entry + ticket        |
| `cancel_my_ticket`                  | Customer ticket UI; customer chatbot        | Customer cancel                         |
| `build_queue_ticket_payload`        | Ticket/queue repositories; customer chatbot | Ticket payload for UI                   |
| `call_next_customer`                | Business queue UI; business chatbot         | Call next (SKIP LOCKED)                 |
| `start_serving_customer`            | Business queue UI                           | Mark serving                            |
| `serve_customer`                    | Business queue UI; business chatbot         | Mark served                             |
| `skip_customer`                     | Business queue UI; business chatbot         | Skip + optionally call next             |
| `set_queue_status`                  | Business queue UI; business chatbot         | Pause / resume / close                  |
| `register_push_token`               | Push registration                           | Store Expo token for the signed-in user |
| `deactivate_push_token`             | Logout                                      | Soft-deactivate current device token    |
| `ensure_notification_preferences`   | Notification settings screen                | Ensure prefs row                        |
| `set_notification_preference_push`  | Notification settings screen                | Toggle push                             |
| `submit_subscription_payment`       | Business owner                              | Submit payment + proof path             |
| `review_subscription_payment`       | Admin                                       | Approve / reject payment                |
| `get_admin_subscription_stats`      | Admin                                       | Dashboard counters                      |
| `set_organization_admin_visibility` | Admin                                       | Hide/show a business                    |

### Internal RPCs (triggers / service role — not client HTTP)

`create_notification`, `dispatch_push_for_notification`, `deactivate_push_tokens_by_values`, `get_or_create_open_queue`, `handle_new_user`, rating/sync helpers, and other trigger functions. These are not client-callable APIs.

### PostgREST tables the clients query or mutate (RLS)

`profiles`, `organizations`, `organization_members`, `departments`, `services`, `queues`, `queue_entries`, `tickets`, `favorites`, `reviews`, `notifications`, `notification_preferences`, `push_tokens`, `subscription_payments`.

### Storage buckets (Supabase Storage HTTP, not Edge Functions)

`avatars`, `organization-logos`, `payment-proofs`. Uploads use the user JWT. Paths are deterministic (`{userId}/avatar.jpg`, `organizations/{orgId}/logo.jpg`).

### GoTrue Auth (platform HTTP, not re-specified here)

Clients use `supabase.auth` for OTP, email/password, Google OAuth, session refresh, password reset, and sign-out. Those map to `/auth/v1/*`. Only `GET /auth/v1/health` is included in `openapi.yaml` because that is the exact health probe implemented in `lib/backend-health.ts`. Copying the rest of GoTrue would invent schemas we do not own.

### Realtime

Postgres changes on `queues`, `queue_entries`, `tickets`, and `notifications` are pushed over the Realtime websocket. That is not REST.
