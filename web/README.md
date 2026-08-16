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

## Routes

- Public: `/`, `/businesses`, `/businesses/[id]`
- Auth: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Customer: `/customer/home`, `/discover`, `/nearby`, `/tickets`, `/favorites`, `/notifications`, `/assistant`, `/join/[orgId]`
- Business: `/business/dashboard`, `/queue`, `/services`, `/departments`, `/history`, `/analytics`, `/assistant`, `/subscription`

Joining a queue requires sign-in. API keys for Gemini, Deepgram, and Azure stay in Edge Functions — never in the browser.
