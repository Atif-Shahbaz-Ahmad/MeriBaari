# MeriBaari Web (Next.js)

Customer + business website that uses the **same Supabase project**, RLS, RPCs, Realtime, and Edge Functions as the Expo app.

## Run

From the repo root (reuses `EXPO_PUBLIC_SUPABASE_*` in `.env`):

```bash
npm run web
```

Or:

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)

The Next.js app lives in `web/`. The repo root is the Expo app (`index.js`), so Vercel must not use the repository root.

In the Vercel project: **Settings → Build and Deployment**

1. **Root Directory:** `web`
2. Enable **Include source files outside of the Root Directory in the Build Step** (the web app imports shared code from the parent folder)
3. **Framework Preset:** Next.js
4. Add env vars: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same values as the mobile app)

Then **Redeploy**.

## Routes

- Public: `/`, `/businesses`, `/businesses/[id]`
- Auth: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Customer: `/customer/home`, `/discover`, `/nearby`, `/tickets`, `/favorites`, `/notifications`, `/assistant`, `/join/[orgId]`
- Business: `/business/dashboard`, `/queue`, `/services`, `/departments`, `/history`, `/analytics`, `/assistant`, `/subscription`

Joining a queue requires sign-in. API keys for Gemini, Deepgram, and Azure stay in Edge Functions — never in the browser.
