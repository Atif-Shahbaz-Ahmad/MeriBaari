# Sentry error monitoring

MeriBaari uses **four separate Sentry projects**. Do not reuse a DSN across runtimes.

| Runtime                 | Sentry project        | Public/secret DSN env    |
| ----------------------- | --------------------- | ------------------------ |
| Expo / React Native     | `meribaari-mobile`    | `EXPO_PUBLIC_SENTRY_DSN` |
| Next.js on Vercel       | `meribaari-web`       | `NEXT_PUBLIC_SENTRY_DSN` |
| Tauri desktop frontend  | `meribaari-desktop`   | `VITE_SENTRY_DSN`        |
| Supabase Edge Functions | `meribaari-functions` | `SENTRY_DSN` (secret)    |

DSNs are designed to be public on clients. Auth tokens are not. Never put `SENTRY_AUTH_TOKEN`, service-role keys, Gemini, Deepgram, or Azure credentials in client apps.

Environments: `development` | `preview` | `staging` | `production`.

## 1. Create Sentry projects

In [sentry.io](https://sentry.io):

1. Create an organization (or use an existing one). Note the **org slug** (`SENTRY_ORG`).
2. Create four projects with those exact slugs:
   - `meribaari-mobile` (React Native)
   - `meribaari-web` (Next.js)
   - `meribaari-desktop` (React)
   - `meribaari-functions` (Deno / generic JS)
3. Copy each project's DSN. Do not hard-code them in source.

Create a Sentry auth token with `project:releases` and `org:read` for source-map uploads. Store it only in Vercel, EAS, and the desktop build environment.

## 2. Vercel (`meribaari-web`)

Root Directory: `web`. Include source files outside the root directory.

Add these environment variables to **Production** and **Preview**:

| Variable                         | Required        | Notes                                                                 |
| -------------------------------- | --------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`         | Yes             | Public DSN for `meribaari-web`                                        |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | No              | Defaults from `VERCEL_ENV` (`production` / `preview` / `development`) |
| `SENTRY_AUTH_TOKEN`              | For source maps | Secret. Do not expose as `NEXT_PUBLIC_*`                              |
| `SENTRY_ORG`                     | For source maps | Org slug                                                              |
| `SENTRY_PROJECT`                 | For source maps | `meribaari-web`                                                       |
| `SENTRY_DSN`                     | No              | Optional server-only alias; falls back to `NEXT_PUBLIC_SENTRY_DSN`    |

Existing Supabase vars stay unchanged (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

Redeploy after saving env vars.

## 3. Expo / EAS (`meribaari-mobile`)

Set for `preview` and `production` (and `development` if you want events from Expo Go):

```bash
npx eas-cli env:set --name EXPO_PUBLIC_SENTRY_DSN --value YOUR_MOBILE_DSN --environment preview --visibility plaintext
npx eas-cli env:set --name EXPO_PUBLIC_SENTRY_DSN --value YOUR_MOBILE_DSN --environment production --visibility plaintext
npx eas-cli env:set --name SENTRY_AUTH_TOKEN --value YOUR_AUTH_TOKEN --environment preview --visibility secret
npx eas-cli env:set --name SENTRY_AUTH_TOKEN --value YOUR_AUTH_TOKEN --environment production --visibility secret
npx eas-cli env:set --name SENTRY_ORG --value YOUR_ORG_SLUG --environment preview --visibility plaintext
npx eas-cli env:set --name SENTRY_ORG --value YOUR_ORG_SLUG --environment production --visibility plaintext
npx eas-cli env:set --name SENTRY_PROJECT --value meribaari-mobile --environment preview --visibility plaintext
npx eas-cli env:set --name SENTRY_PROJECT --value meribaari-mobile --environment production --visibility plaintext
```

`SENTRY_ORG` enables the Expo config plugin so release source maps and native debug symbols can upload during EAS Build. Without it, JS error monitoring still works.

Local `.env`:

```
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_ENVIRONMENT=development
```

## 4. Tauri production (`meribaari-desktop`)

Desktop production must not depend on localhost. Bake the **desktop** DSN at `npm run desktop:build` from the repo-root `.env`:

```
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=meribaari-desktop
```

`connect-src` in `desktop/src-tauri/tauri.conf.json` allows `https://*.ingest.sentry.io`, `https://*.ingest.us.sentry.io`, and `https://*.sentry.io`. Native Rust/Tauri code is unchanged.

## 5. Edge Function deployment (`meribaari-functions`)

Do **not** put this DSN in any client app.

```bash
npx supabase secrets set SENTRY_DSN=YOUR_FUNCTIONS_DSN
npx supabase secrets set SENTRY_ENVIRONMENT=production

npx supabase functions deploy customer-chatbot
npx supabase functions deploy business-chatbot
npx supabase functions deploy voice-transcribe
npx supabase functions deploy voice-speak
npx supabase functions deploy send-push-notification
```

Hosted functions default to the `production` environment if `SENTRY_ENVIRONMENT` is unset. For local `supabase functions serve`, set `SENTRY_ENVIRONMENT=development` when using the test header.

Optional local test flag (never set in production):

```bash
npx supabase secrets set SENTRY_ALLOW_TEST=1
```

Then, against a local or preview function:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/customer-chatbot" -H "x-sentry-test: 1"
```

The Edge reporter uses Sentry's envelope ingest API (the official Deno SDK is still beta and is not used here). Events are flushed before the isolate freezes. Audio, prompts, tokens, and API keys are stripped.

## 6. Test commands

Start each app with its DSN set, then:

| Runtime           | How                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------ |
| Mobile (dev)      | Profile → Developer → **Send Sentry test error** (`__DEV__` only)                    |
| Web (dev/preview) | Open http://localhost:3000/dev/sentry-test                                           |
| Desktop (dev)     | Open `#/dev/sentry-test`                                                             |
| Functions         | `x-sentry-test: 1` only when `SENTRY_ALLOW_TEST=1` and environment is not production |

Production users never see these controls. `/dev/sentry-test` returns 404 on Vercel production.

```bash
npm run typecheck
npm run lint
npm run web:typecheck
npm run web:lint
npm run web:build
npm run desktop:typecheck
cd desktop && npm run build
```

Confirm the apps still start with **no DSN set** (Sentry stays disabled) and with a DSN set (test events appear in the matching Sentry project).

## What is captured

- Client JS crashes and unhandled errors
- Next.js server/RSC/middleware errors via `onRequestError`
- Gemini 400 / 429 / 500 / timeout after existing retries (no extra Gemini calls)
- Deepgram STT and Azure/Deepgram TTS provider failures
- Microphone / recording failures on clients (not raw audio)
- Expo push HTTP failures

Not captured: expected auth/validation (`unauthorized`, `forbidden`, `invalid_data`, `no_speech`), audio bytes, Gemini prompts, tokens, or private customer payloads.
