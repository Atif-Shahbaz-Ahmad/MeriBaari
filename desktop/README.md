# MeriBaari Desktop (Tauri)

Production desktop client for business queue management. It uses the **same Supabase project**, RLS, Realtime, and Edge Functions as the Expo mobile app and Next.js website.

This is not a wrapper around `npm run web`. Development may load a local Vite server. Production builds embed the frontend and talk to Supabase directly.

## Requirements

- Node 22+
- Rust (rustc/cargo)
- Windows (primary), with WebView2
- Repo-root `.env` with:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`, or `AZURE_SPEECH_KEY` in desktop files. Those stay in Edge Functions.

## Develop

From the repo root:

```bash
cd desktop
npm install
cd ..
npm run desktop
```

Dev mode loads `http://localhost:1420` (Vite). That is development only.

## Production build (Windows installer)

```bash
cd desktop
npm install
cd ..
npm run desktop:build
```

Output (typical):

- `desktop/src-tauri/target/release/meribaari-desktop.exe`
- `desktop/src-tauri/target/release/bundle/nsis/MeriBaari_1.0.0_x64-setup.exe`

Install the setup executable, close terminals and VS Code, and launch MeriBaari from the Start menu. It must work with no `npm`, no Next.js, and no localhost backend.

## Architecture

- Tauri 2 window + native notifications
- Vite/React UI, reusing shared domain, repositories, and web screens
- Desktop-first dashboard and queue workspace
- Auth session persisted in localStorage via Supabase Auth
- Organization ownership still resolved with `getMyOrganization()` / `owner_id = auth.uid()`
