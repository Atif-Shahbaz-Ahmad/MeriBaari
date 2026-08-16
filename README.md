# MeriBaari (My Turn)

Smart digital queue management — Day 1 foundation for Expo SDK 54 + Expo Go.

## Stack

- Expo SDK 54 · Expo Router · TypeScript
- NativeWind · Plus Jakarta Sans
- Supabase Auth · TanStack Query · Zustand
- React Hook Form + Zod · Expo Secure Store
- Reanimated · Gesture Handler · Lucide

## Run

Content (queues, auth, chat, tickets) comes from the **hosted Supabase project** in `.env`. The mobile app does **not** call Next.js, Tauri, or a localhost API.

Copy `.env.example` → `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Enable Phone and/or Email OTP in the Supabase dashboard.

### Develop (Expo Go)

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (SDK 54). Metro must stay running so the phone can load JavaScript. That is development only — it is not the data backend.

Leave the keys empty only if you want in-app **demo/mock** data.

### Standalone install (no Metro, no localhost)

Preview/production builds embed the JS bundle and talk only to hosted Supabase. After you install the app, close the terminal — it must work with no `npm start`, no Next.js, and no localhost backend.

```bash
npm run android:preview
```

Cloud builds need the same keys as EAS environment variables (`preview` and `production`):

```bash
npx eas-cli env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT.supabase.co --environment preview --visibility plaintext
npx eas-cli env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_ANON_KEY --environment preview --visibility sensitive
```

Preview/production builds fail if the URL is missing or points at localhost.

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
| `npm start` | Expo Go (Metro; content still from Supabase) |
| `npm run android:preview` | Standalone Android APK (no localhost) |
| `npm run ios:preview` | Standalone iOS build (no localhost) |
| `npm run lint` | ESLint (mobile) |
| `npm run format` | Prettier |
| `npm run web` | Next.js web app (dev) |
| `npm run desktop` | Tauri desktop app (dev) |
| `npm run desktop:build` | Windows installer (production) |

## Day 1 scope

Done: design system, splash, onboarding, auth gate, home UI (mock), tabs.

Not yet: live queues, real QR tickets, push wiring, admin.
