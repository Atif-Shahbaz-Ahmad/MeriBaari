-- =============================================================================
-- MeriBaari — In-app Notification System (Prompt 4.7)
-- Schema enrichment, idempotent inserts, queue RPC hooks, Realtime publication
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) New notification_type enum values (Prompt 4.7 types)
-- ---------------------------------------------------------------------------

alter table public.notifications
  alter column type type text using type::text;

drop type if exists public.notification_type;

create type public.notification_type as enum (
  'QUEUE_JOINED',
  'TICKET_CALLED',
  'TICKET_SERVING',
  'TICKET_SERVED',
  'TICKET_SKIPPED',
  'QUEUE_PAUSED',
  'QUEUE_RESUMED',
  'QUEUE_CLOSED',
  'QUEUE_TURN_APPROACHING',
  'QUEUE_CANCELLED',
  'SYSTEM'
);

-- Map any leftover legacy rows (unlikely in fresh envs) to SYSTEM
update public.notifications
set type = 'SYSTEM'
where type not in (
  'QUEUE_JOINED',
  'TICKET_CALLED',
  'TICKET_SERVING',
  'TICKET_SERVED',
  'TICKET_SKIPPED',
  'QUEUE_PAUSED',
  'QUEUE_RESUMED',
  'QUEUE_CLOSED',
  'QUEUE_TURN_APPROACHING',
  'QUEUE_CANCELLED',
  'SYSTEM'
);

alter table public.notifications
  alter column type type public.notification_type
  using type::public.notification_type;

-- ---------------------------------------------------------------------------
-- 2) Columns
-- ---------------------------------------------------------------------------

alter table public.notifications
  add column if not exists ticket_id uuid references public.tickets (id) on delete set null,
  add column if not exists queue_id uuid references public.queues (id) on delete set null,
  add column if not exists organization_id uuid references public.organizations (id) on delete set null,
  add column if not exists read_at timestamptz,
  add column if not exists event_key text;

-- Backfill legacy rows so unique (user_id, event_key) is safe
update public.notifications
set event_key = 'legacy:' || id::text
where event_key is null;

-- Keep description as the message body (domain maps description ↔ message).
comment on column public.notifications.description is
  'Notification message body (domain field: message).';

-- ---------------------------------------------------------------------------
-- 3) Indexes
-- ---------------------------------------------------------------------------

create index if not exists notifications_user_id_idx
  on public.notifications (user_id);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

create index if not exists notifications_is_read_idx
  on public.notifications (is_read);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read)
  where is_read = false;

-- Idempotency: one event_key per user (event_key always set by create_notification)
create unique index if not exists notifications_user_event_key_uidx
  on public.notifications (user_id, event_key);

-- ---------------------------------------------------------------------------
-- 4) RLS (own rows only; no client inserts)
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users cannot insert arbitrary notifications" on public.notifications;
create policy "Users cannot insert arbitrary notifications"
  on public.notifications for insert
  to authenticated
  with check (false);

-- ---------------------------------------------------------------------------
-- 5) Preferences prep (defaults only — no UI yet)
-- ---------------------------------------------------------------------------

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  in_app boolean not null default true,
  push boolean not null default false,
  email boolean not null default false,
  whatsapp boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users manage own notification preferences" on public.notification_preferences;
create policy "Users manage own notification preferences"
  on public.notification_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6) Idempotent notification creator (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

create or replace function public.create_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_event_key text,
  p_ticket_id uuid default null,
  p_queue_id uuid default null,
  p_organization_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_in_app boolean := true;
begin
  if p_user_id is null or p_event_key is null or length(trim(p_event_key)) = 0 then
    return null;
  end if;

  -- Respect in_app preference when present (default enabled).
  select coalesce(np.in_app, true) into v_in_app
  from public.notification_preferences np
  where np.user_id = p_user_id;

  if not found then
    v_in_app := true;
  end if;

  if not v_in_app then
    return null;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    description,
    ticket_id,
    queue_id,
    organization_id,
    is_read,
    event_key
  )
  values (
    p_user_id,
    p_type,
    p_title,
    coalesce(p_message, ''),
    p_ticket_id,
    p_queue_id,
    p_organization_id,
    false,
    p_event_key
  )
  on conflict (user_id, event_key)
  do nothing
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    return null;
end;
$$;

revoke all on function public.create_notification(
  uuid, public.notification_type, text, text, text, uuid, uuid, uuid
) from public;
grant execute on function public.create_notification(
  uuid, public.notification_type, text, text, text, uuid, uuid, uuid
) to service_role;

-- Helpers that resolve org name for templates
create or replace function public.notification_org_name(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(name), ''), 'the organization')
  from public.organizations
  where id = p_organization_id;
$$;

-- ---------------------------------------------------------------------------
-- 7) Turn-approaching after position recalc
-- ---------------------------------------------------------------------------

create or replace function public.recalc_waiting_positions(p_queue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_org_id uuid;
  v_org_name text;
  v_ticket_id uuid;
  v_people_ahead integer;
begin
  with ordered as (
    select
      id,
      row_number() over (order by joined_at asc, created_at asc) as new_pos
    from public.queue_entries
    where queue_id = p_queue_id
      and status = 'waiting'
  )
  update public.queue_entries qe
  set
    position = ordered.new_pos,
    estimated_wait_minutes = greatest(ordered.new_pos - 1, 0) * (
      select average_service_time from public.queues where id = p_queue_id
    ),
    updated_at = now()
  from ordered
  where qe.id = ordered.id;

  update public.tickets t
  set updated_at = now()
  from public.queue_entries qe
  where qe.id = t.queue_entry_id
    and qe.queue_id = p_queue_id
    and qe.status = 'waiting';

  select organization_id into v_org_id from public.queues where id = p_queue_id;
  v_org_name := public.notification_org_name(v_org_id);

  -- peopleAhead <= 2  ⇒  position <= 3 (1-based including self)
  for r in
    select qe.id as entry_id, qe.customer_id, qe.position, qe.ticket_number
    from public.queue_entries qe
    where qe.queue_id = p_queue_id
      and qe.status = 'waiting'
      and qe.position between 1 and 3
      and qe.customer_id is not null
  loop
    v_people_ahead := greatest(r.position - 1, 0);
    if v_people_ahead > 2 then
      continue;
    end if;

    select t.id into v_ticket_id
    from public.tickets t
    where t.queue_entry_id = r.entry_id
    limit 1;

    perform public.create_notification(
      r.customer_id,
      'QUEUE_TURN_APPROACHING',
      'Your Turn Is Near',
      'You are almost next. Please be ready.',
      'QUEUE_TURN_APPROACHING:' || coalesce(v_ticket_id::text, r.entry_id::text),
      v_ticket_id,
      p_queue_id,
      v_org_id
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8) Notify active customers for a queue status change
-- ---------------------------------------------------------------------------

create or replace function public.notify_queue_customers(
  p_queue_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_event_suffix text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_org_id uuid;
begin
  select organization_id into v_org_id from public.queues where id = p_queue_id;

  for r in
    select
      t.id as ticket_id,
      t.user_id,
      t.ticket_number
    from public.tickets t
    join public.queue_entries qe on qe.id = t.queue_entry_id
    where t.queue_id = p_queue_id
      and qe.status in ('waiting', 'called', 'serving')
      and t.user_id is not null
  loop
    perform public.create_notification(
      r.user_id,
      p_type,
      p_title,
      p_message,
      p_type::text || ':' || p_queue_id::text || ':' || r.ticket_id::text || ':' || p_event_suffix,
      r.ticket_id,
      p_queue_id,
      v_org_id
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9) Patch queue RPCs to emit notifications
-- ---------------------------------------------------------------------------

create or replace function public.join_queue(p_service_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_queue public.queues%rowtype;
  v_seq integer;
  v_ticket_number text;
  v_people_ahead integer;
  v_position integer;
  v_est integer;
  v_entry_id uuid;
  v_ticket_id uuid;
  v_existing uuid;
  v_org_name text;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  v_queue := public.get_or_create_open_queue(p_service_id);

  if v_queue.status::text = 'paused' then
    raise exception 'QUEUE_PAUSED';
  end if;
  if v_queue.status::text = 'closed' then
    raise exception 'QUEUE_CLOSED';
  end if;
  if v_queue.status::text not in ('open', 'active') then
    raise exception 'QUEUE_UNAVAILABLE';
  end if;

  select * into v_queue from public.queues where id = v_queue.id for update;

  select t.id into v_existing
  from public.tickets t
  join public.queue_entries qe on qe.id = t.queue_entry_id
  where t.user_id = v_uid
    and t.queue_id = v_queue.id
    and qe.status in ('waiting', 'called', 'serving')
  limit 1;

  if v_existing is not null then
    raise exception 'ALREADY_JOINED:%', v_existing;
  end if;

  select count(*)::integer into v_people_ahead
  from public.queue_entries
  where queue_id = v_queue.id
    and status = 'waiting';

  v_position := v_people_ahead + 1;
  v_est := v_people_ahead * greatest(v_queue.average_service_time, 1);

  update public.queues
  set
    ticket_seq = ticket_seq + 1,
    next_number = ticket_seq + 2,
    total_waiting = v_people_ahead + 1,
    updated_at = now()
  where id = v_queue.id
  returning ticket_seq into v_seq;

  v_ticket_number := public.format_ticket_number(v_queue.prefix, v_seq);

  insert into public.queue_entries (
    queue_id,
    customer_id,
    service_id,
    ticket_number,
    position,
    status,
    joined_at,
    estimated_wait_minutes
  )
  values (
    v_queue.id,
    v_uid,
    p_service_id,
    v_ticket_number,
    v_position,
    'waiting',
    now(),
    v_est
  )
  returning id into v_entry_id;

  insert into public.tickets (
    queue_entry_id,
    user_id,
    queue_id,
    organization_id,
    department_id,
    service_id,
    ticket_number,
    status,
    qr_code,
    generated_at
  )
  values (
    v_entry_id,
    v_uid,
    v_queue.id,
    v_queue.organization_id,
    v_queue.department_id,
    p_service_id,
    v_ticket_number,
    'waiting',
    'MB-' || v_ticket_number || '-' || replace(gen_random_uuid()::text, '-', ''),
    now()
  )
  returning id into v_ticket_id;

  perform public.recalc_waiting_positions(v_queue.id);

  v_org_name := public.notification_org_name(v_queue.organization_id);

  perform public.create_notification(
    v_uid,
    'QUEUE_JOINED',
    'Queue Joined',
    'You joined the queue at ' || v_org_name || '.',
    'QUEUE_JOINED:' || v_ticket_id::text,
    v_ticket_id,
    v_queue.id,
    v_queue.organization_id
  );

  return public.build_queue_ticket_payload(v_ticket_id);
end;
$$;

create or replace function public.call_next_customer(p_queue_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue public.queues%rowtype;
  v_entry public.queue_entries%rowtype;
  v_ticket_id uuid;
  v_called_at timestamptz;
begin
  v_queue := public.assert_queue_staff(p_queue_id);

  select * into v_entry
  from public.queue_entries
  where queue_id = p_queue_id
    and status = 'waiting'
  order by joined_at asc, created_at asc
  limit 1
  for update skip locked;

  if not found then
    raise exception 'NO_CUSTOMERS_WAITING';
  end if;

  update public.queue_entries
  set
    status = 'called',
    called_at = now(),
    position = 0,
    estimated_wait_minutes = 0,
    updated_at = now()
  where id = v_entry.id
  returning * into v_entry;

  v_called_at := v_entry.called_at;

  update public.tickets
  set status = 'called', updated_at = now()
  where queue_entry_id = v_entry.id
  returning id into v_ticket_id;

  update public.queues
  set
    current_number = v_entry.ticket_number,
    current_serving_number = v_entry.ticket_number,
    updated_at = now()
  where id = p_queue_id;

  perform public.recalc_queue_waiting(p_queue_id);
  perform public.recalc_waiting_positions(p_queue_id);

  if v_entry.customer_id is not null and v_ticket_id is not null then
    perform public.create_notification(
      v_entry.customer_id,
      'TICKET_CALLED',
      'Your Turn',
      'Your ticket ' || v_entry.ticket_number || ' has been called.',
      'TICKET_CALLED:' || v_ticket_id::text || ':' || coalesce(v_called_at::text, ''),
      v_ticket_id,
      p_queue_id,
      v_queue.organization_id
    );
  end if;

  return jsonb_build_object(
    'entryId', v_entry.id,
    'ticketId', v_ticket_id,
    'ticketNumber', v_entry.ticket_number,
    'status', 'called',
    'calledAt', v_entry.called_at,
    'customerId', v_entry.customer_id
  );
end;
$$;

create or replace function public.start_serving_customer(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.queue_entries%rowtype;
  v_ticket_id uuid;
  v_org_id uuid;
begin
  select * into v_entry from public.queue_entries where id = p_entry_id for update;
  if not found then
    raise exception 'ENTRY_NOT_FOUND';
  end if;

  perform public.assert_queue_staff(v_entry.queue_id);

  if v_entry.status not in ('called', 'waiting') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.queue_entries
  set
    status = 'serving',
    called_at = coalesce(called_at, now()),
    updated_at = now()
  where id = p_entry_id
  returning * into v_entry;

  update public.tickets
  set status = 'serving', updated_at = now()
  where queue_entry_id = p_entry_id
  returning id into v_ticket_id;

  update public.queues
  set
    current_number = v_entry.ticket_number,
    current_serving_number = v_entry.ticket_number,
    updated_at = now()
  where id = v_entry.queue_id
  returning organization_id into v_org_id;

  perform public.recalc_queue_waiting(v_entry.queue_id);
  perform public.recalc_waiting_positions(v_entry.queue_id);

  if v_entry.customer_id is not null and v_ticket_id is not null then
    perform public.create_notification(
      v_entry.customer_id,
      'TICKET_SERVING',
      'Now Serving',
      'You are now being served.',
      'TICKET_SERVING:' || v_ticket_id::text,
      v_ticket_id,
      v_entry.queue_id,
      v_org_id
    );
  end if;

  return jsonb_build_object(
    'entryId', v_entry.id,
    'ticketId', v_ticket_id,
    'ticketNumber', v_entry.ticket_number,
    'status', 'serving'
  );
end;
$$;

create or replace function public.serve_customer(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.queue_entries%rowtype;
  v_ticket_id uuid;
  v_now timestamptz := now();
  v_org_id uuid;
  v_org_name text;
begin
  select * into v_entry from public.queue_entries where id = p_entry_id for update;
  if not found then
    raise exception 'ENTRY_NOT_FOUND';
  end if;

  perform public.assert_queue_staff(v_entry.queue_id);

  if v_entry.status::text in ('served', 'completed', 'cancelled', 'skipped') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.queue_entries
  set
    status = 'served',
    served_at = v_now,
    completed_at = v_now,
    position = 0,
    estimated_wait_minutes = 0,
    updated_at = v_now
  where id = p_entry_id
  returning * into v_entry;

  update public.tickets
  set status = 'served', updated_at = v_now
  where queue_entry_id = p_entry_id
  returning id into v_ticket_id;

  select organization_id into v_org_id from public.queues where id = v_entry.queue_id;
  v_org_name := public.notification_org_name(v_org_id);

  perform public.recalc_queue_waiting(v_entry.queue_id);
  perform public.recalc_waiting_positions(v_entry.queue_id);

  if v_entry.customer_id is not null and v_ticket_id is not null then
    perform public.create_notification(
      v_entry.customer_id,
      'TICKET_SERVED',
      'Service Completed',
      'Your service at ' || v_org_name || ' has been completed.',
      'TICKET_SERVED:' || v_ticket_id::text,
      v_ticket_id,
      v_entry.queue_id,
      v_org_id
    );
  end if;

  return jsonb_build_object(
    'entryId', v_entry.id,
    'ticketId', v_ticket_id,
    'ticketNumber', v_entry.ticket_number,
    'status', 'served',
    'servedAt', v_now
  );
end;
$$;

create or replace function public.skip_customer(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.queue_entries%rowtype;
  v_ticket_id uuid;
  v_next jsonb;
  v_org_id uuid;
begin
  select * into v_entry from public.queue_entries where id = p_entry_id for update;
  if not found then
    raise exception 'ENTRY_NOT_FOUND';
  end if;

  perform public.assert_queue_staff(v_entry.queue_id);

  if v_entry.status::text in ('served', 'completed', 'cancelled', 'skipped') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.queue_entries
  set
    status = 'skipped',
    position = 0,
    estimated_wait_minutes = 0,
    updated_at = now()
  where id = p_entry_id
  returning * into v_entry;

  update public.tickets
  set status = 'skipped', updated_at = now()
  where queue_entry_id = p_entry_id
  returning id into v_ticket_id;

  select organization_id into v_org_id from public.queues where id = v_entry.queue_id;

  perform public.recalc_queue_waiting(v_entry.queue_id);
  perform public.recalc_waiting_positions(v_entry.queue_id);

  if v_entry.customer_id is not null and v_ticket_id is not null then
    perform public.create_notification(
      v_entry.customer_id,
      'TICKET_SKIPPED',
      'Ticket Skipped',
      'Your ticket ' || v_entry.ticket_number
        || ' was skipped. Please speak with staff if you still need service.',
      'TICKET_SKIPPED:' || v_ticket_id::text,
      v_ticket_id,
      v_entry.queue_id,
      v_org_id
    );
  end if;

  begin
    v_next := public.call_next_customer(v_entry.queue_id);
  exception
    when others then
      if SQLERRM like 'NO_CUSTOMERS_WAITING%' then
        v_next := null;
      else
        raise;
      end if;
  end;

  return jsonb_build_object(
    'entryId', v_entry.id,
    'ticketId', v_ticket_id,
    'ticketNumber', v_entry.ticket_number,
    'status', 'skipped',
    'next', v_next
  );
end;
$$;

create or replace function public.set_queue_status(p_queue_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue public.queues%rowtype;
  v_prev text;
  v_status public.queue_status;
  v_org_name text;
  v_suffix text;
begin
  v_queue := public.assert_queue_staff(p_queue_id);
  v_prev := case when v_queue.status::text = 'active' then 'open' else v_queue.status::text end;

  if p_status not in ('open', 'paused', 'closed', 'active') then
    raise exception 'INVALID_STATUS';
  end if;

  if p_status = 'open' then
    v_status := 'active';
  else
    v_status := p_status::public.queue_status;
  end if;

  update public.queues
  set status = v_status, updated_at = now()
  where id = p_queue_id
  returning * into v_queue;

  v_org_name := public.notification_org_name(v_queue.organization_id);
  v_suffix := extract(epoch from v_queue.updated_at)::bigint::text;

  if v_status::text = 'paused' and v_prev <> 'paused' then
    perform public.notify_queue_customers(
      p_queue_id,
      'QUEUE_PAUSED',
      'Queue Paused',
      'The queue at ' || v_org_name || ' has been temporarily paused.',
      v_suffix
    );
  elsif v_status::text in ('active', 'open') and v_prev = 'paused' then
    perform public.notify_queue_customers(
      p_queue_id,
      'QUEUE_RESUMED',
      'Queue Resumed',
      'The queue at ' || v_org_name || ' has resumed.',
      v_suffix
    );
  elsif v_status::text = 'closed' and v_prev <> 'closed' then
    perform public.notify_queue_customers(
      p_queue_id,
      'QUEUE_CLOSED',
      'Queue Closed',
      'The queue at ' || v_org_name || ' has been closed.',
      v_suffix
    );
    -- Active tickets become invalid when the queue closes.
    perform public.notify_queue_customers(
      p_queue_id,
      'QUEUE_CANCELLED',
      'Queue Cancelled',
      'Your active ticket at ' || v_org_name || ' is no longer valid because the queue closed.',
      v_suffix
    );
  end if;

  return jsonb_build_object(
    'id', v_queue.id,
    'status', case when v_queue.status::text = 'active' then 'open' else v_queue.status::text end,
    'totalWaiting', v_queue.total_waiting,
    'currentNumber', v_queue.current_number
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 10) Realtime publication for notifications
-- ---------------------------------------------------------------------------

alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
