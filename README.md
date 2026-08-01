# MeriBaari (My Turn)

Smart digital queue management — Day 1 foundation for Expo SDK 54 + Expo Go.

## Stack

- Expo SDK 54 · Expo Router · TypeScript
- NativeWind · Plus Jakarta Sans
- Supabase Auth · TanStack Query · Zustand
- React Hook Form + Zod · Expo Secure Store
- Reanimated · Gesture Handler · Lucide

## Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (SDK 54).

### Demo auth (no Supabase yet)

Leave `.env` empty and use **Continue as Guest (Demo)**, or enter any valid phone/email and any 6-digit OTP.

### Real Supabase auth

Copy `.env.example` → `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Enable Phone and/or Email OTP in the Supabase dashboard.

## Structure

```
app/               Expo Router ((auth), (tabs), splash gate)
components/        ui · cards · buttons · layout
features/          auth · home (feature modules)
hooks/ lib/ store/ types/ utils/ constants/
assets/images/     branding-guide.png · ui-design-system.png
```

## Branding

Logo usage follows `assets/images/branding-guide.png`:

| Asset | Where |
|-------|--------|
| Full logo light/dark | Splash, onboarding, login |
| Symbol mark | Compact UI / headers |
| App icon blue/dark | Store & home screen (`app.json` icon fields) |

In-app logos are SVG (`Logo` / `LogoMark`) matching primary `#2563EB` and secondary `#10B981`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Expo Go |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Day 1 scope

Done: design system, splash, onboarding, auth gate, home UI (mock), tabs.

Not yet: live queues, real QR tickets, push wiring, admin.
