-- =============================================================================
-- MeriBaari — Business-owner notification functions (depends on enum commit
-- from 20260811000012).
-- Updates is_push_notification_type and join_queue to support CUSTOMER_JOINED.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Include CUSTOMER_JOINED in push-eligible types
-- ---------------------------------------------------------------------------

create or replace function public.is_push_notification_type(p_type public.notification_type)
returns boolean
language sql
immutable
as $$
  select p_type::text in (
    'TICKET_CALLED',
    'TICKET_SERVING',
    'QUEUE_TURN_APPROACHING',
    'QUEUE_PAUSED',
    'QUEUE_RESUMED',
    'QUEUE_CLOSED',
    'TICKET_SERVED',
    'TICKET_SKIPPED',
    'CUSTOMER_JOINED'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2) Patch join_queue() — add owner notification after customer notification
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
  v_owner_id uuid;
  v_customer_joined_type public.notification_type;
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

  -- Existing customer notification (unchanged)
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

  -- Business owner notification
  select owner_id into v_owner_id
  from public.organizations
  where id = v_queue.organization_id;

  if v_owner_id is not null and v_owner_id is distinct from v_uid then
    v_customer_joined_type := 'CUSTOMER_JOINED';
    perform public.create_notification(
      v_owner_id,
      v_customer_joined_type,
      'New Customer Joined',
      'A new customer has joined your queue at ' || v_org_name || '.',
      'CUSTOMER_JOINED:' || v_ticket_id::text,
      v_ticket_id,
      v_queue.id,
      v_queue.organization_id
    );
  end if;

  return public.build_queue_ticket_payload(v_ticket_id);
end;
$$;
