-- Queue system enrichment: per-service queues, tickets, concurrent-safe RPCs
-- Hierarchy: Organization → Department → Service → Queue → Queue Entry → Ticket

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'queue_status' and e.enumlabel = 'open'
  ) then
    alter type public.queue_status add value 'open';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'queue_entry_status' and e.enumlabel = 'served'
  ) then
    alter type public.queue_entry_status add value 'served';
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum (
      'waiting',
      'called',
      'serving',
      'served',
      'skipped',
      'cancelled'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Queues columns
-- ---------------------------------------------------------------------------

alter table public.queues
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade,
  add column if not exists service_id uuid references public.services (id) on delete cascade,
  add column if not exists current_number text not null default '',
  add column if not exists next_number integer not null default 1
    check (next_number >= 1),
  add column if not exists average_service_time integer not null default 10
    check (average_service_time > 0),
  add column if not exists total_waiting integer not null default 0
    check (total_waiting >= 0),
  add column if not exists prefix text not null default 'A',
  add column if not exists ticket_seq integer not null default 0
    check (ticket_seq >= 0);

-- Backfill organization_id from department
update public.queues q
set organization_id = d.organization_id
from public.departments d
where d.id = q.department_id
  and q.organization_id is null;

-- Sync legacy columns into new fields
update public.queues
set
  current_number = coalesce(nullif(current_number, ''), current_serving_number, ''),
  average_service_time = case
    when average_service_time is null or average_service_time <= 0
      then greatest(coalesce(average_waiting_time, 10), 1)
    else average_service_time
  end
where true;

-- Note: DB keeps queue_status 'active' as the joinable/open state.
-- App domain maps active ↔ open. Enum value 'open' is added for forward compat.

-- Require organization_id going forward (only if all rows filled)
do $$
begin
  if not exists (select 1 from public.queues where organization_id is null) then
    alter table public.queues
      alter column organization_id set not null;
  end if;
end
$$;

create index if not exists queues_organization_id_idx
  on public.queues (organization_id);

create index if not exists queues_service_id_idx
  on public.queues (service_id);

create index if not exists queues_org_status_idx
  on public.queues (organization_id, status);

-- One non-closed queue per service
-- Compare enum values directly (status::text is not IMMUTABLE in index predicates)
create unique index if not exists queues_one_active_per_service_idx
  on public.queues (service_id)
  where service_id is not null
    and status <> 'closed'::public.queue_status;

-- Integrity: org / department / service alignment
create or replace function public.validate_queue_hierarchy()
returns trigger
language plpgsql
as $$
declare
  v_org_id uuid;
  v_dept_id uuid;
begin
  if new.organization_id is null then
    raise exception 'QUEUE_INVALID_HIERARCHY';
  end if;

  select organization_id into v_org_id
  from public.departments
  where id = new.department_id;

  if v_org_id is null or v_org_id <> new.organization_id then
    raise exception 'QUEUE_INVALID_HIERARCHY';
  end if;

  if new.service_id is not null then
    select department_id into v_dept_id
    from public.services
    where id = new.service_id;

    if v_dept_id is null or v_dept_id <> new.department_id then
      raise exception 'QUEUE_INVALID_HIERARCHY';
    end if;
  end if;

  -- Keep legacy column in sync
  new.current_serving_number := coalesce(nullif(new.current_number, ''), new.current_serving_number, '');
  new.average_waiting_time := greatest(coalesce(new.average_service_time, 10), 0);

  return new;
end;
$$;

drop trigger if exists queues_validate_hierarchy on public.queues;
create trigger queues_validate_hierarchy
  before insert or update on public.queues
  for each row execute function public.validate_queue_hierarchy();

drop trigger if exists queues_set_updated_at on public.queues;
create trigger queues_set_updated_at
  before update on public.queues
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Queue entries columns
-- ---------------------------------------------------------------------------

alter table public.queue_entries
  add column if not exists estimated_wait_minutes integer not null default 0
    check (estimated_wait_minutes >= 0),
  add column if not exists served_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- user_id alias view via customer_id (keep customer_id as FK to profiles)
-- Sync served_at ↔ completed_at
create or replace function public.sync_queue_entry_served()
returns trigger
language plpgsql
as $$
begin
  if new.status::text in ('served', 'completed') then
    if new.served_at is null then
      new.served_at := coalesce(new.completed_at, now());
    end if;
    if new.completed_at is null then
      new.completed_at := new.served_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists queue_entries_sync_served on public.queue_entries;
create trigger queue_entries_sync_served
  before insert or update on public.queue_entries
  for each row execute function public.sync_queue_entry_served();

create index if not exists queue_entries_active_user_idx
  on public.queue_entries (customer_id, queue_id, status)
  where status in (
    'waiting'::public.queue_entry_status,
    'called'::public.queue_entry_status,
    'serving'::public.queue_entry_status
  );

-- ---------------------------------------------------------------------------
-- Tickets enrichment
-- ---------------------------------------------------------------------------

alter table public.tickets
  add column if not exists user_id uuid references public.profiles (id) on delete cascade,
  add column if not exists queue_id uuid references public.queues (id) on delete cascade,
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade,
  add column if not exists department_id uuid references public.departments (id) on delete cascade,
  add column if not exists service_id uuid references public.services (id) on delete cascade,
  add column if not exists ticket_number text,
  add column if not exists status public.ticket_status not null default 'waiting',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Backfill from queue_entries where possible
update public.tickets t
set
  user_id = coalesce(t.user_id, qe.customer_id),
  queue_id = coalesce(t.queue_id, qe.queue_id),
  service_id = coalesce(t.service_id, qe.service_id),
  ticket_number = coalesce(t.ticket_number, qe.ticket_number),
  department_id = coalesce(
    t.department_id,
    (select q.department_id from public.queues q where q.id = qe.queue_id)
  ),
  organization_id = coalesce(
    t.organization_id,
    (select q.organization_id from public.queues q where q.id = qe.queue_id)
  )
from public.queue_entries qe
where qe.id = t.queue_entry_id
  and (
    t.user_id is null
    or t.queue_id is null
    or t.ticket_number is null
  );

-- Ensure qr_code remains unique / non-null for legacy rows
update public.tickets
set qr_code = coalesce(nullif(qr_code, ''), 'MB-' || id::text)
where qr_code is null or qr_code = '';

create index if not exists tickets_user_id_idx on public.tickets (user_id);
create index if not exists tickets_queue_id_idx on public.tickets (queue_id);
create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_user_status_idx on public.tickets (user_id, status);

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.format_ticket_number(p_prefix text, p_seq integer)
returns text
language sql
immutable
as $$
  select upper(coalesce(nullif(trim(p_prefix), ''), 'A'))
    || lpad(p_seq::text, 3, '0');
$$;

create or replace function public.recalc_queue_waiting(p_queue_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.queue_entries
  where queue_id = p_queue_id
    and status = 'waiting';

  update public.queues
  set
    total_waiting = v_count,
    updated_at = now()
  where id = p_queue_id;

  return v_count;
end;
$$;

create or replace function public.recalc_waiting_positions(p_queue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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

  -- Mirror waiting ticket estimates
  update public.tickets t
  set
    updated_at = now()
  from public.queue_entries qe
  where qe.id = t.queue_entry_id
    and qe.queue_id = p_queue_id
    and qe.status = 'waiting';
end;
$$;

create or replace function public.map_entry_to_ticket_status(p_status public.queue_entry_status)
returns public.ticket_status
language plpgsql
immutable
as $$
begin
  case p_status::text
    when 'waiting' then return 'waiting';
    when 'called' then return 'called';
    when 'serving' then return 'serving';
    when 'served' then return 'served';
    when 'completed' then return 'served';
    when 'skipped' then return 'skipped';
    when 'cancelled' then return 'cancelled';
    when 'missed' then return 'cancelled';
    else return 'waiting';
  end case;
end;
$$;

-- Build denormalized ticket payload for the app
create or replace function public.build_queue_ticket_payload(p_ticket_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r record;
  v_people_ahead integer;
  v_position integer;
  v_est integer;
  v_avg integer;
  v_current text;
  v_queue_status text;
begin
  select
    t.id,
    t.ticket_number,
    t.queue_id,
    t.organization_id,
    t.department_id,
    t.service_id,
    t.status::text as ticket_status,
    t.queue_entry_id,
    t.qr_code,
    t.created_at,
    t.updated_at,
    qe.joined_at,
    qe.called_at,
    qe.served_at,
    qe.completed_at,
    qe.cancelled_at,
    qe.position as entry_position,
    qe.estimated_wait_minutes as entry_est,
    qe.status::text as entry_status,
    q.current_number,
    q.status::text as queue_status,
    q.average_service_time,
    o.name as organization_name,
    o.category as organization_category,
    d.name as department_name,
    s.name as service_name
  into r
  from public.tickets t
  join public.queue_entries qe on qe.id = t.queue_entry_id
  join public.queues q on q.id = t.queue_id
  join public.organizations o on o.id = t.organization_id
  join public.departments d on d.id = t.department_id
  join public.services s on s.id = t.service_id
  where t.id = p_ticket_id;

  if not found then
    return null;
  end if;

  v_avg := greatest(coalesce(r.average_service_time, 10), 1);
  v_current := coalesce(nullif(r.current_number, ''), '—');
  v_queue_status := r.queue_status;

  if r.entry_status = 'waiting' then
    select count(*)::integer into v_people_ahead
    from public.queue_entries
    where queue_id = r.queue_id
      and status = 'waiting'
      and (joined_at < r.joined_at or (joined_at = r.joined_at and id < r.queue_entry_id));

    v_position := v_people_ahead + 1;
    v_est := v_people_ahead * v_avg;
  else
    v_people_ahead := 0;
    v_position := case when r.entry_status in ('called', 'serving') then 0 else coalesce(r.entry_position, 0) end;
    v_est := 0;
  end if;

  return jsonb_build_object(
    'id', r.id,
    'ticketNumber', r.ticket_number,
    'queueId', r.queue_id,
    'organizationId', r.organization_id,
    'locationName', r.organization_name,
    'organizationName', r.organization_name,
    'departmentId', r.department_id,
    'departmentName', r.department_name,
    'serviceId', r.service_id,
    'serviceName', r.service_name,
    'status', case
      when r.ticket_status = 'served' then 'completed'
      when r.ticket_status = 'waiting' and v_people_ahead <= 1 and v_people_ahead >= 0 and r.entry_status = 'waiting'
        then case when v_people_ahead = 0 then 'almost' else 'waiting' end
      when r.ticket_status = 'waiting' and v_people_ahead = 0 then 'almost'
      else r.ticket_status
    end,
    'position', v_position,
    'peopleAhead', v_people_ahead,
    'estimatedWaitMinutes', v_est,
    'currentServing', v_current,
    'joinedAt', r.joined_at,
    'completedAt', coalesce(r.served_at, r.completed_at),
    'cancelledAt', r.cancelled_at,
    'estimatedCompletionAt', case
      when v_est > 0 then to_jsonb((r.joined_at + make_interval(mins => v_est))::timestamptz)
      else 'null'::jsonb
    end,
    'reminderEnabled', true,
    'queueEntryId', r.queue_entry_id,
    'qrCode', r.qr_code,
    'queueStatus', v_queue_status,
    'organizationCategory', r.organization_category,
    'averageServiceTime', v_avg
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- get_or_create_open_queue (internal helper)
-- ---------------------------------------------------------------------------

create or replace function public.get_or_create_open_queue(p_service_id uuid)
returns public.queues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_dept public.departments%rowtype;
  v_org public.organizations%rowtype;
  v_queue public.queues%rowtype;
  v_prefix text;
begin
  select * into v_service from public.services where id = p_service_id for share;
  if not found then
    raise exception 'SERVICE_NOT_FOUND';
  end if;

  if v_service.is_active is not true or v_service.status <> 'active' then
    raise exception 'SERVICE_INACTIVE';
  end if;

  select * into v_dept from public.departments where id = v_service.department_id for share;
  if not found then
    raise exception 'DEPARTMENT_NOT_FOUND';
  end if;

  if v_dept.is_active is not true or v_dept.status <> 'active' then
    raise exception 'DEPARTMENT_INACTIVE';
  end if;

  select * into v_org from public.organizations where id = v_dept.organization_id for share;
  if not found then
    raise exception 'ORGANIZATION_NOT_FOUND';
  end if;

  if v_org.status <> 'active' or coalesce(v_org.is_active, true) is not true then
    raise exception 'ORGANIZATION_INACTIVE';
  end if;

  -- Prefer existing non-closed queue for this service
  select * into v_queue
  from public.queues
  where service_id = p_service_id
    and status::text in ('open', 'paused', 'active')
  order by created_at asc
  limit 1
  for update;

  if found then
    return v_queue;
  end if;

  v_prefix := upper(substr(regexp_replace(coalesce(v_service.name, 'A'), '[^A-Za-z]', '', 'g'), 1, 1));
  if v_prefix is null or v_prefix = '' then
    v_prefix := 'A';
  end if;

  insert into public.queues (
    organization_id,
    department_id,
    service_id,
    status,
    current_number,
    current_serving_number,
    next_number,
    average_service_time,
    average_waiting_time,
    total_waiting,
    prefix,
    ticket_seq
  )
  values (
    v_org.id,
    v_dept.id,
    v_service.id,
    'active',
    '',
    '',
    1,
    greatest(coalesce(v_service.estimated_duration, 10), 1),
    greatest(coalesce(v_service.estimated_duration, 10), 0),
    0,
    v_prefix,
    0
  )
  returning * into v_queue;

  return v_queue;
exception
  when unique_violation then
    select * into v_queue
    from public.queues
    where service_id = p_service_id
      and status::text in ('open', 'paused', 'active')
    order by created_at asc
    limit 1
    for update;
    if not found then
      raise;
    end if;
    return v_queue;
end;
$$;

-- ---------------------------------------------------------------------------
-- Preview (no ticket creation)
-- ---------------------------------------------------------------------------

create or replace function public.get_queue_join_preview(p_service_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_dept public.departments%rowtype;
  v_org public.organizations%rowtype;
  v_queue public.queues%rowtype;
  v_waiting integer := 0;
  v_avg integer;
  v_can_join boolean := true;
  v_status text := 'active';
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select * into v_service from public.services where id = p_service_id;
  if not found then
    raise exception 'SERVICE_NOT_FOUND';
  end if;
  if v_service.is_active is not true or v_service.status <> 'active' then
    raise exception 'SERVICE_INACTIVE';
  end if;

  select * into v_dept from public.departments where id = v_service.department_id;
  if not found then
    raise exception 'DEPARTMENT_NOT_FOUND';
  end if;
  if v_dept.is_active is not true or v_dept.status <> 'active' then
    raise exception 'DEPARTMENT_INACTIVE';
  end if;

  select * into v_org from public.organizations where id = v_dept.organization_id;
  if not found then
    raise exception 'ORGANIZATION_NOT_FOUND';
  end if;
  if v_org.status <> 'active' or coalesce(v_org.is_active, true) is not true then
    raise exception 'ORGANIZATION_INACTIVE';
  end if;

  v_avg := greatest(coalesce(v_service.estimated_duration, 10), 1);

  select * into v_queue
  from public.queues
  where service_id = p_service_id
    and status::text in ('open', 'paused', 'active')
  order by created_at asc
  limit 1;

  if found then
    v_status := v_queue.status::text;
    v_avg := greatest(coalesce(v_queue.average_service_time, v_avg), 1);
    select count(*)::integer into v_waiting
    from public.queue_entries
    where queue_id = v_queue.id
      and status = 'waiting';
    v_can_join := v_status in ('open', 'active');
  end if;

  return jsonb_build_object(
    'queueId', v_queue.id,
    'queueStatus', case when v_status = 'active' then 'open' else v_status end,
    'currentServing', coalesce(nullif(v_queue.current_number, ''), '—'),
    'waitingCount', v_waiting,
    'estimatedWaitMinutes', v_waiting * v_avg,
    'averageServiceTime', v_avg,
    'canJoin', v_can_join
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- join_queue
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

  -- Lock queue row for atomic ticket numbering
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

  return public.build_queue_ticket_payload(v_ticket_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_queue_entry (by ticket id for customer UX)
-- ---------------------------------------------------------------------------

create or replace function public.cancel_my_ticket(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ticket public.tickets%rowtype;
  v_entry public.queue_entries%rowtype;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'TICKET_NOT_FOUND';
  end if;

  if v_ticket.user_id <> v_uid then
    raise exception 'PERMISSION_DENIED';
  end if;

  select * into v_entry from public.queue_entries where id = v_ticket.queue_entry_id for update;
  if not found then
    raise exception 'ENTRY_NOT_FOUND';
  end if;

  if v_entry.status::text in ('served', 'completed') then
    raise exception 'ALREADY_SERVED';
  end if;

  if v_entry.status = 'cancelled' then
    return public.build_queue_ticket_payload(v_ticket.id);
  end if;

  if v_entry.status not in ('waiting', 'called') then
    raise exception 'CANNOT_CANCEL';
  end if;

  update public.queue_entries
  set
    status = 'cancelled',
    cancelled_at = now(),
    position = 0,
    estimated_wait_minutes = 0,
    updated_at = now()
  where id = v_entry.id;

  update public.tickets
  set
    status = 'cancelled',
    updated_at = now()
  where id = v_ticket.id;

  perform public.recalc_queue_waiting(v_entry.queue_id);
  perform public.recalc_waiting_positions(v_entry.queue_id);

  return public.build_queue_ticket_payload(v_ticket.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Business ops
-- ---------------------------------------------------------------------------

create or replace function public.assert_queue_staff(p_queue_id uuid)
returns public.queues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue public.queues%rowtype;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select * into v_queue from public.queues where id = p_queue_id for update;
  if not found then
    raise exception 'QUEUE_NOT_FOUND';
  end if;

  if not public.is_org_staff(v_queue.organization_id) then
    raise exception 'PERMISSION_DENIED';
  end if;

  return v_queue;
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
  where id = v_entry.queue_id;

  perform public.recalc_queue_waiting(v_entry.queue_id);
  perform public.recalc_waiting_positions(v_entry.queue_id);

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

  perform public.recalc_queue_waiting(v_entry.queue_id);
  perform public.recalc_waiting_positions(v_entry.queue_id);

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

  perform public.recalc_queue_waiting(v_entry.queue_id);
  perform public.recalc_waiting_positions(v_entry.queue_id);

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
  v_status public.queue_status;
begin
  v_queue := public.assert_queue_staff(p_queue_id);

  if p_status not in ('open', 'paused', 'closed', 'active') then
    raise exception 'INVALID_STATUS';
  end if;

  -- Persist joinable state as 'active' (domain maps active ↔ open)
  if p_status = 'open' then
    v_status := 'active';
  else
    v_status := p_status::public.queue_status;
  end if;

  update public.queues
  set status = v_status, updated_at = now()
  where id = p_queue_id
  returning * into v_queue;

  return jsonb_build_object(
    'id', v_queue.id,
    'status', case when v_queue.status::text = 'active' then 'open' else v_queue.status::text end,
    'totalWaiting', v_queue.total_waiting,
    'currentNumber', v_queue.current_number
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.get_queue_join_preview(uuid) to authenticated;
grant execute on function public.join_queue(uuid) to authenticated;
grant execute on function public.cancel_my_ticket(uuid) to authenticated;
grant execute on function public.call_next_customer(uuid) to authenticated;
grant execute on function public.start_serving_customer(uuid) to authenticated;
grant execute on function public.serve_customer(uuid) to authenticated;
grant execute on function public.skip_customer(uuid) to authenticated;
grant execute on function public.set_queue_status(uuid, text) to authenticated;
grant execute on function public.build_queue_ticket_payload(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policy refresh for enriched tickets / org-scoped queues
-- ---------------------------------------------------------------------------

drop policy if exists "Org staff can manage queues" on public.queues;
create policy "Org staff can manage queues"
  on public.queues for all
  using (
    public.is_org_staff(organization_id)
    or exists (
      select 1 from public.departments d
      where d.id = queues.department_id
        and public.is_org_staff(d.organization_id)
    )
  )
  with check (
    public.is_org_staff(organization_id)
    or exists (
      select 1 from public.departments d
      where d.id = queues.department_id
        and public.is_org_staff(d.organization_id)
    )
  );

-- Customers may insert own tickets (RPC is security definer; keep direct policy tight)
drop policy if exists "Customers can update own tickets" on public.tickets;
create policy "Customers can update own tickets"
  on public.tickets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Customers can read own tickets by user" on public.tickets;
create policy "Customers can read own tickets by user"
  on public.tickets for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.queue_entries qe
      where qe.id = tickets.queue_entry_id
        and qe.customer_id = auth.uid()
    )
  );

drop policy if exists "Org staff can manage org tickets" on public.tickets;
create policy "Org staff can manage org tickets"
  on public.tickets for all
  using (
    public.is_org_staff(organization_id)
    or exists (
      select 1
      from public.queue_entries qe
      join public.queues q on q.id = qe.queue_id
      where qe.id = tickets.queue_entry_id
        and public.is_org_staff(q.organization_id)
    )
  )
  with check (
    public.is_org_staff(organization_id)
    or exists (
      select 1
      from public.queue_entries qe
      join public.queues q on q.id = qe.queue_id
      where qe.id = tickets.queue_entry_id
        and public.is_org_staff(q.organization_id)
    )
  );
