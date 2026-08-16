-- Customer ratings & reviews for completed (served) visits.
-- One review per ticket; aggregates maintained on organizations.

-- ---------------------------------------------------------------------------
-- Aggregate columns on organizations
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column if not exists rating numeric(3, 2) not null default 0
    check (rating >= 0 and rating <= 5),
  add column if not exists review_count integer not null default 0
    check (review_count >= 0);

-- ---------------------------------------------------------------------------
-- Reviews table
-- ---------------------------------------------------------------------------

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_ticket_unique unique (ticket_id),
  constraint reviews_comment_length check (
    comment is null or char_length(comment) <= 1000
  )
);

create index if not exists reviews_organization_id_created_at_idx
  on public.reviews (organization_id, created_at desc);

create index if not exists reviews_user_id_idx
  on public.reviews (user_id);

create index if not exists reviews_ticket_id_idx
  on public.reviews (ticket_id);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recalculate organization rating aggregates
-- ---------------------------------------------------------------------------

create or replace function public.recalc_organization_rating(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3, 2);
  v_count integer;
begin
  select
    coalesce(round(avg(r.rating)::numeric, 2), 0),
    count(*)::integer
  into v_avg, v_count
  from public.reviews r
  where r.organization_id = p_organization_id;

  update public.organizations
  set
    rating = v_avg,
    review_count = v_count,
    updated_at = now()
  where id = p_organization_id;
end;
$$;

create or replace function public.reviews_recalc_org_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_organization_rating(old.organization_id);
    return old;
  end if;

  perform public.recalc_organization_rating(new.organization_id);

  if tg_op = 'UPDATE'
    and old.organization_id is distinct from new.organization_id
  then
    perform public.recalc_organization_rating(old.organization_id);
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_recalc_org_rating on public.reviews;
create trigger reviews_recalc_org_rating
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_recalc_org_rating();

-- ---------------------------------------------------------------------------
-- Validate review insert (served ticket owned by reviewer)
-- ---------------------------------------------------------------------------

create or replace function public.reviews_validate_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
begin
  select * into v_ticket
  from public.tickets
  where id = new.ticket_id;

  if not found then
    raise exception 'Ticket not found for review'
      using errcode = 'P0002';
  end if;

  if v_ticket.user_id is distinct from new.user_id then
    raise exception 'You can only review your own tickets'
      using errcode = '42501';
  end if;

  if v_ticket.status is distinct from 'served' then
    raise exception 'Only completed visits can be reviewed'
      using errcode = '23514';
  end if;

  if v_ticket.organization_id is null
    or v_ticket.organization_id is distinct from new.organization_id
  then
    raise exception 'Review organization does not match ticket'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_validate_insert on public.reviews;
create trigger reviews_validate_insert
  before insert on public.reviews
  for each row execute function public.reviews_validate_insert();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.reviews enable row level security;

drop policy if exists "Customers can read own reviews" on public.reviews;
create policy "Customers can read own reviews"
  on public.reviews for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Org members can read org reviews" on public.reviews;
create policy "Org members can read org reviews"
  on public.reviews for select
  to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "Customers can insert own reviews" on public.reviews;
create policy "Customers can insert own reviews"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.tickets t
      where t.id = ticket_id
        and t.user_id = auth.uid()
        and t.status = 'served'
        and t.organization_id = organization_id
    )
  );

-- No UPDATE / DELETE policies — reviews are write-once from the client.
