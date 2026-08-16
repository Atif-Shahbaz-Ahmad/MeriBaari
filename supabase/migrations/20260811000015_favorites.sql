-- Customer organization favorites (businesses only — not services).
-- Scoped to auth.uid(); unique per user + organization.

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_organization_unique unique (user_id, organization_id)
);

create index if not exists favorites_user_id_created_at_idx
  on public.favorites (user_id, created_at desc);

create index if not exists favorites_organization_id_idx
  on public.favorites (organization_id);

alter table public.favorites enable row level security;

drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- No UPDATE policy — favorites are add/remove only.
