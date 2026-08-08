# MeriBaari Supabase Backend

SQL migrations and generated database types live here.

## Status

**Auth + Profiles:** Supabase repositories are active when `EXPO_PUBLIC_SUPABASE_*` is set.
**Everything else** (orgs, queues, tickets, …) still uses mock repositories.

## Auth email (development)

Use the **default Supabase Auth email provider** for development and testing.

Do **not** configure custom SMTP, Resend, or branded email templates at this stage.
Production email delivery will be set up during final deployment.

In the Supabase dashboard (Auth → URL configuration), add the app redirect:

- `meribaari://auth/callback`
- Expo Auth Session redirect URI from `getAuthRedirectUrl()` if different in Expo Go

## Auth wiring

| Interface | Implementation (when configured) |
|-----------|----------------------------------|
| `AuthRepository` | `SupabaseAuthRepository` |
| `ProfileRepository` | `SupabaseProfileRepository` |

DI switch lives in `data/di/container.ts` via `isSupabaseConfigured`.

## Applying migrations

```bash
npx supabase db push
# or
npx supabase migration up
```

Required for auth: `profiles` table + `handle_new_user` trigger + RLS (including insert policy).

## Migrations

| File | Purpose |
|------|---------|
| `migrations/20260801000001_initial_schema.sql` | Tables, FKs, indexes, triggers |
| `migrations/20260801000002_rls_policies.sql` | Row Level Security policies |
| `migrations/20260803000003_profiles_avatar_url.sql` | avatar_url alignment + trigger refresh |
| `migrations/20260807000004_profiles_insert_policy.sql` | Users can insert own profile |

## Regenerating types

```bash
npx supabase gen types typescript --project-id <project-id> > supabase/types/database.ts
```

## Switching other domains to Supabase later

1. Implement `Supabase*Repository` classes against `Database` types.
2. In `data/di/container.ts`, replace the mock repository for that domain only.
3. Services and UI remain unchanged.
