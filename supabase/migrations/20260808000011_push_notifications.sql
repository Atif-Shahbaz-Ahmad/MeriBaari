-- =============================================================================
-- MeriBaari — Push Notifications (Prompt 4.8)
-- push_tokens, preference helpers, push dispatch via Edge Function (pg_net)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) push_tokens
-- ---------------------------------------------------------------------------

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('android', 'ios', 'web')),
  device_name text,
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_token_unique unique (token)
);

create index if not exists push_tokens_user_id_idx
  on public.push_tokens (user_id);

create index if not exists push_tokens_user_active_idx
  on public.push_tokens (user_id, is_active)
  where is_active = true;

comment on table public.push_tokens is
  'Expo push tokens per device. Treat tokens as private device identifiers.';

comment on column public.push_tokens.token is
  'Expo push token (ExponentPushToken[...]). Unique globally so account switches reassign safely.';

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) RLS — own tokens only
-- ---------------------------------------------------------------------------

alter table public.push_tokens enable row level security;

drop policy if exists "Users can read own push tokens" on public.push_tokens;
create policy "Users can read own push tokens"
  on public.push_tokens for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own push tokens" on public.push_tokens;
create policy "Users can insert own push tokens"
  on public.push_tokens for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own push tokens" on public.push_tokens;
create policy "Users can update own push tokens"
  on public.push_tokens for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own push tokens" on public.push_tokens;
create policy "Users can delete own push tokens"
  on public.push_tokens for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3) Upsert helper for clients (reassigns token on account switch)
-- ---------------------------------------------------------------------------

create or replace function public.register_push_token(
  p_token text,
  p_platform text,
  p_device_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_platform text;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'INVALID_TOKEN';
  end if;

  v_platform := lower(trim(p_platform));
  if v_platform not in ('android', 'ios', 'web') then
    raise exception 'INVALID_PLATFORM';
  end if;

  insert into public.push_tokens (
    user_id,
    token,
    platform,
    device_name,
    is_active,
    last_used_at
  )
  values (
    v_uid,
    trim(p_token),
    v_platform,
    nullif(trim(coalesce(p_device_name, '')), ''),
    true,
    now()
  )
  on conflict (token) do update
  set
    user_id = excluded.user_id,
    platform = excluded.platform,
    device_name = coalesce(excluded.device_name, public.push_tokens.device_name),
    is_active = true,
    last_used_at = now(),
    updated_at = now()
  returning id into v_id;

  -- Enable push preference when a device is registered.
  insert into public.notification_preferences (user_id, in_app, push)
  values (v_uid, true, true)
  on conflict (user_id) do update
  set
    push = true,
    updated_at = now();

  return v_id;
end;
$$;

revoke all on function public.register_push_token(text, text, text) from public;
grant execute on function public.register_push_token(text, text, text) to authenticated;

create or replace function public.deactivate_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_remaining integer;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    return;
  end if;

  update public.push_tokens
  set
    is_active = false,
    updated_at = now()
  where token = trim(p_token)
    and user_id = v_uid
    and is_active = true;

  select count(*)::integer into v_remaining
  from public.push_tokens
  where user_id = v_uid
    and is_active = true;

  if v_remaining = 0 then
    update public.notification_preferences
    set push = false, updated_at = now()
    where user_id = v_uid;
  end if;
end;
$$;

revoke all on function public.deactivate_push_token(text) from public;
grant execute on function public.deactivate_push_token(text) to authenticated;

-- Service-role helper used by Edge Function for invalid Expo tokens
create or replace function public.deactivate_push_tokens_by_values(p_tokens text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_tokens is null or cardinality(p_tokens) = 0 then
    return 0;
  end if;

  update public.push_tokens
  set
    is_active = false,
    updated_at = now()
  where token = any (p_tokens)
    and is_active = true;

  get diagnostics v_count = row_count;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.deactivate_push_tokens_by_values(text[]) from public;
grant execute on function public.deactivate_push_tokens_by_values(text[]) to service_role;

-- ---------------------------------------------------------------------------
-- 4) Preference helpers
-- ---------------------------------------------------------------------------

create or replace function public.ensure_notification_preferences(p_user_id uuid)
returns public.notification_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.notification_preferences%rowtype;
begin
  insert into public.notification_preferences (user_id, in_app, push, email, whatsapp)
  values (p_user_id, true, false, false, false)
  on conflict (user_id) do nothing;

  select * into v_row
  from public.notification_preferences
  where user_id = p_user_id;

  return v_row;
end;
$$;

revoke all on function public.ensure_notification_preferences(uuid) from public;
grant execute on function public.ensure_notification_preferences(uuid) to authenticated;
grant execute on function public.ensure_notification_preferences(uuid) to service_role;

create or replace function public.set_notification_preference_push(p_enabled boolean)
returns public.notification_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.notification_preferences%rowtype;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  insert into public.notification_preferences (user_id, in_app, push)
  values (v_uid, true, coalesce(p_enabled, false))
  on conflict (user_id) do update
  set
    push = coalesce(p_enabled, false),
    updated_at = now();

  select * into v_row
  from public.notification_preferences
  where user_id = v_uid;

  return v_row;
end;
$$;

revoke all on function public.set_notification_preference_push(boolean) from public;
grant execute on function public.set_notification_preference_push(boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Push-eligible types + dispatch via Edge Function (pg_net)
-- ---------------------------------------------------------------------------

create extension if not exists pg_net with schema extensions;

-- Types that should attempt Expo push delivery (customers).
create or replace function public.is_push_notification_type(p_type public.notification_type)
returns boolean
language sql
immutable
as $$
  select p_type in (
    'TICKET_CALLED',
    'TICKET_SERVING',
    'QUEUE_TURN_APPROACHING',
    'QUEUE_PAUSED',
    'QUEUE_RESUMED',
    'QUEUE_CLOSED',
    'TICKET_SERVED',
    'TICKET_SKIPPED'
  );
$$;

create or replace function public.get_push_dispatch_config()
returns table (project_url text, service_role_key text)
language plpgsql
stable
security definer
set search_path = public, vault
as $$
declare
  v_url text;
  v_key text;
begin
  -- Preferred: Supabase Vault secrets (never commit keys).
  begin
    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'supabase_url'
    limit 1;
  exception
    when undefined_table then
      v_url := null;
    when others then
      v_url := null;
  end;

  begin
    select decrypted_secret into v_key
    from vault.decrypted_secrets
    where name = 'service_role_key'
    limit 1;
  exception
    when undefined_table then
      v_key := null;
    when others then
      v_key := null;
  end;

  -- Local/dev fallback via database settings (optional).
  if v_url is null then
    begin
      v_url := nullif(current_setting('app.settings.supabase_url', true), '');
    exception
      when others then
        v_url := null;
    end;
  end if;

  if v_key is null then
    begin
      v_key := nullif(current_setting('app.settings.service_role_key', true), '');
    exception
      when others then
        v_key := null;
    end;
  end if;

  -- Local Supabase default URL when running inside the Docker network.
  if v_url is null then
    v_url := 'http://kong:8000';
  end if;

  project_url := rtrim(v_url, '/');
  service_role_key := v_key;
  return next;
end;
$$;

revoke all on function public.get_push_dispatch_config() from public;

create or replace function public.dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_push boolean := false;
  v_cfg record;
  v_url text;
  v_headers jsonb;
  v_body jsonb;
begin
  if not public.is_push_notification_type(NEW.type) then
    return NEW;
  end if;

  select coalesce(np.push, false) into v_push
  from public.notification_preferences np
  where np.user_id = NEW.user_id;

  if not found then
    -- No preferences row yet: send only if user has active tokens.
    select exists (
      select 1
      from public.push_tokens pt
      where pt.user_id = NEW.user_id
        and pt.is_active = true
    ) into v_push;
  end if;

  if not v_push then
    return NEW;
  end if;

  -- Skip if user has no active tokens (avoid useless Edge calls).
  if not exists (
    select 1
    from public.push_tokens pt
    where pt.user_id = NEW.user_id
      and pt.is_active = true
  ) then
    return NEW;
  end if;

  select * into v_cfg from public.get_push_dispatch_config() limit 1;

  if v_cfg.service_role_key is null or length(v_cfg.service_role_key) = 0 then
    -- Push delivery not configured yet — in-app notification still exists.
    return NEW;
  end if;

  v_url := v_cfg.project_url || '/functions/v1/send-push-notification';
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_cfg.service_role_key
  );
  v_body := jsonb_build_object(
    'notificationId', NEW.id,
    'eventKey', NEW.event_key
  );

  begin
    perform net.http_post(
      url := v_url,
      headers := v_headers,
      body := v_body
    );
  exception
    when others then
      -- Never fail the originating queue transaction because of push.
      raise warning 'push dispatch failed for notification %: %', NEW.id, SQLERRM;
  end;

  return NEW;
end;
$$;

drop trigger if exists notifications_dispatch_push on public.notifications;
create trigger notifications_dispatch_push
  after insert on public.notifications
  for each row
  execute function public.dispatch_push_for_notification();

-- ---------------------------------------------------------------------------
-- 6) Sharper customer-facing copy for priority types
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
  -- Idempotent: event_key QUEUE_TURN_APPROACHING:<ticketId> unique per user.
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
      'You are almost next at ' || v_org_name || '.',
      'QUEUE_TURN_APPROACHING:' || coalesce(v_ticket_id::text, r.entry_id::text),
      v_ticket_id,
      p_queue_id,
      v_org_id
    );
  end loop;
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
      'Your ticket ' || v_entry.ticket_number
        || ' has been called. Please proceed to the service counter.',
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
