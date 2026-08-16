-- =============================================================================
-- MeriBaari — Business subscription, payment proof, admin approval
-- Organizations stay hidden from customers until a payment is approved.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'subscription_status'
  ) then
    create type public.subscription_status as enum (
      'draft',
      'pending_payment',
      'pending_approval',
      'active',
      'rejected'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'subscription_payment_status'
  ) then
    create type public.subscription_payment_status as enum (
      'pending',
      'approved',
      'rejected'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'subscription_payment_method'
  ) then
    create type public.subscription_payment_method as enum (
      'bank_transfer',
      'easypaisa'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Organization subscription columns
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column if not exists subscription_status public.subscription_status not null default 'draft',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles (id) on delete set null,
  add column if not exists subscription_submitted_at timestamptz,
  add column if not exists payment_rejection_reason text;

comment on column public.organizations.subscription_status is
  'Business live-state. Customers only see organizations with subscription_status = active plus is_active/status.';

-- Existing businesses remain visible (do not hide already-live orgs).
update public.organizations
set subscription_status = 'active'
where subscription_status = 'draft'
  and is_active = true
  and status = 'active';

create index if not exists organizations_subscription_status_idx
  on public.organizations (subscription_status);

create index if not exists organizations_public_discovery_idx
  on public.organizations (subscription_status, is_active, status);

-- ---------------------------------------------------------------------------
-- 3) Payment records (audit trail — never store screenshot bytes)
-- ---------------------------------------------------------------------------

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'PKR',
  payment_method public.subscription_payment_method not null,
  payment_proof_path text not null,
  status public.subscription_payment_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_payments_rejection_reason_chk check (
    status <> 'rejected'
    or (rejection_reason is not null and length(trim(rejection_reason)) > 0)
  )
);

create index if not exists subscription_payments_org_idx
  on public.subscription_payments (organization_id, submitted_at desc);

create index if not exists subscription_payments_user_idx
  on public.subscription_payments (user_id, submitted_at desc);

create index if not exists subscription_payments_status_idx
  on public.subscription_payments (status, submitted_at desc);

create unique index if not exists subscription_payments_one_pending_per_org
  on public.subscription_payments (organization_id)
  where status = 'pending';

drop trigger if exists subscription_payments_set_updated_at on public.subscription_payments;
create trigger subscription_payments_set_updated_at
  before update on public.subscription_payments
  for each row execute function public.set_updated_at();

comment on table public.subscription_payments is
  'Manual subscription payment submissions. Screenshot lives in private storage; this row stores the path and review audit.';

-- ---------------------------------------------------------------------------
-- 4) Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.is_organization_customer_visible(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = org_id
      and o.subscription_status = 'active'
      and o.is_active = true
      and o.status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.is_organization_customer_visible(uuid) from public;
grant execute on function public.is_organization_customer_visible(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Protect subscription fields + prevent self-promotion to admin
-- ---------------------------------------------------------------------------

create or replace function public.protect_organization_subscription_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Direct client writes (role authenticated) cannot change approval fields.
  -- SECURITY DEFINER RPCs run as the function owner and are allowed.
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.subscription_status := 'draft';
      new.approved_at := null;
      new.approved_by := null;
      new.subscription_submitted_at := null;
      new.payment_rejection_reason := null;
      new.is_active := false;
      if new.status = 'active' then
        new.status := 'inactive';
      end if;
    elsif tg_op = 'UPDATE' then
      new.subscription_status := old.subscription_status;
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
      new.subscription_submitted_at := old.subscription_submitted_at;
      new.payment_rejection_reason := old.payment_rejection_reason;

      -- Operational pause is allowed only after approval.
      if old.subscription_status is distinct from 'active' then
        new.is_active := false;
        if new.status = 'active' then
          new.status := 'inactive';
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_protect_subscription on public.organizations;
create trigger organizations_protect_subscription
  before insert or update on public.organizations
  for each row execute function public.protect_organization_subscription_fields();

create or replace function public.protect_profile_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Clients cannot promote to or demote from admin. SQL editor / service role can.
  if auth.uid() is not null then
    if tg_op = 'INSERT' and new.role = 'admin' then
      new.role := null;
    elsif tg_op = 'UPDATE'
      and (new.role is distinct from old.role)
      and (new.role = 'admin' or old.role = 'admin')
    then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin_role on public.profiles;
create trigger profiles_protect_admin_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_admin_role();

-- ---------------------------------------------------------------------------
-- 6) RLS — organizations / departments / services / queues / favorites
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can read active or owned organizations"
  on public.organizations;
create policy "Authenticated can read active or owned organizations"
  on public.organizations
  for select
  to authenticated
  using (
    public.is_organization_customer_visible(id)
    or owner_id = auth.uid()
    or public.is_org_member(id)
    or public.is_admin()
  );

drop policy if exists "Admins can read all organizations" on public.organizations;

drop policy if exists "Authenticated can read active or owned departments"
  on public.departments;
create policy "Authenticated can read active or owned departments"
  on public.departments
  for select
  to authenticated
  using (
    (
      is_active = true
      and status = 'active'
      and public.is_organization_customer_visible(organization_id)
    )
    or public.is_org_owner(organization_id)
    or public.is_org_member(organization_id)
    or public.is_admin()
  );

drop policy if exists "Authenticated can read active or owned services"
  on public.services;
create policy "Authenticated can read active or owned services"
  on public.services
  for select
  to authenticated
  using (
    (
      is_active = true
      and status = 'active'
      and exists (
        select 1
        from public.departments d
        where d.id = services.department_id
          and d.is_active = true
          and d.status = 'active'
          and public.is_organization_customer_visible(d.organization_id)
      )
    )
    or exists (
      select 1
      from public.departments d
      where d.id = services.department_id
        and (
          public.is_org_owner(d.organization_id)
          or public.is_org_member(d.organization_id)
          or public.is_admin()
        )
    )
  );

drop policy if exists "Authenticated can read queues" on public.queues;
drop policy if exists "Authenticated can read public or owned queues" on public.queues;
create policy "Authenticated can read public or owned queues"
  on public.queues
  for select
  to authenticated
  using (
    public.is_organization_customer_visible(organization_id)
    or public.is_org_member(organization_id)
    or public.is_admin()
  );

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
  on public.favorites
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_organization_customer_visible(organization_id)
  );

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7) RLS — subscription_payments (reads only; writes via RPC)
-- ---------------------------------------------------------------------------

alter table public.subscription_payments enable row level security;

drop policy if exists "Owners and admins can read subscription payments"
  on public.subscription_payments;
create policy "Owners and admins can read subscription payments"
  on public.subscription_payments
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_org_owner(organization_id)
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 8) Private payment-proofs bucket
-- Path: {user_id}/{filename}.jpg
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  2097152,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners can upload payment proofs" on storage.objects;
create policy "Owners can upload payment proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owners can update payment proofs" on storage.objects;
create policy "Owners can update payment proofs"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owners can delete payment proofs" on storage.objects;
create policy "Owners can delete payment proofs"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owners and admins can read payment proofs" on storage.objects;
create policy "Owners and admins can read payment proofs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- 9) Push-eligible subscription notifications
-- ---------------------------------------------------------------------------

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
    'TICKET_SKIPPED',
    'CUSTOMER_JOINED',
    'SUBSCRIPTION_PAYMENT_SUBMITTED',
    'SUBSCRIPTION_APPROVED',
    'SUBSCRIPTION_REJECTED'
  );
$$;

-- ---------------------------------------------------------------------------
-- 10) Queue join: customers only for approved/live businesses
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

  if not public.is_organization_customer_visible(v_org.id)
     and not public.is_org_staff(v_org.id) then
    raise exception 'ORGANIZATION_INACTIVE';
  end if;

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
  if not public.is_organization_customer_visible(v_org.id) then
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
-- 11) Submit / review RPCs
-- ---------------------------------------------------------------------------

create or replace function public.submit_subscription_payment(
  p_organization_id uuid,
  p_payment_method public.subscription_payment_method,
  p_payment_proof_path text,
  p_amount numeric,
  p_currency text default 'PKR'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations%rowtype;
  v_payment_id uuid;
  v_owner public.profiles%rowtype;
  v_admin record;
  v_amount numeric;
  v_path text;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_organization_id is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;

  v_path := trim(coalesce(p_payment_proof_path, ''));
  if v_path = '' then
    raise exception 'PROOF_REQUIRED';
  end if;

  if split_part(v_path, '/', 1) is distinct from v_uid::text then
    raise exception 'PROOF_PATH_INVALID';
  end if;

  v_amount := coalesce(p_amount, 0);
  if v_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select * into v_org
  from public.organizations
  where id = p_organization_id
  for update;

  if not found then
    raise exception 'ORGANIZATION_NOT_FOUND';
  end if;

  if v_org.owner_id is distinct from v_uid then
    raise exception 'FORBIDDEN';
  end if;

  if v_org.subscription_status = 'active' then
    raise exception 'ALREADY_ACTIVE';
  end if;

  if exists (
    select 1
    from public.subscription_payments sp
    where sp.organization_id = p_organization_id
      and sp.status = 'pending'
  ) then
    raise exception 'PAYMENT_ALREADY_PENDING';
  end if;

  insert into public.subscription_payments (
    organization_id,
    user_id,
    amount,
    currency,
    payment_method,
    payment_proof_path,
    status,
    submitted_at
  )
  values (
    p_organization_id,
    v_uid,
    v_amount,
    coalesce(nullif(trim(p_currency), ''), 'PKR'),
    p_payment_method,
    v_path,
    'pending',
    now()
  )
  returning id into v_payment_id;

  update public.organizations
  set
    subscription_status = 'pending_approval',
    subscription_submitted_at = now(),
    payment_rejection_reason = null,
    is_active = false,
    status = 'inactive',
    updated_at = now()
  where id = p_organization_id;

  select * into v_owner from public.profiles where id = v_uid;

  for v_admin in
    select id from public.profiles where role = 'admin'
  loop
    perform public.create_notification(
      v_admin.id,
      'SUBSCRIPTION_PAYMENT_SUBMITTED',
      'New payment received for verification',
      coalesce(nullif(trim(v_org.name), ''), 'A business')
        || ' submitted a '
        || v_amount::text
        || ' '
        || coalesce(nullif(trim(p_currency), ''), 'PKR')
        || ' '
        || replace(p_payment_method::text, '_', ' ')
        || ' payment for review.',
      'SUBSCRIPTION_PAYMENT_SUBMITTED:' || v_payment_id::text,
      null,
      null,
      p_organization_id
    );
  end loop;

  return v_payment_id;
end;
$$;

create or replace function public.review_subscription_payment(
  p_payment_id uuid,
  p_action text,
  p_rejection_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_payment public.subscription_payments%rowtype;
  v_org public.organizations%rowtype;
  v_action text;
  v_reason text;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  v_action := lower(trim(coalesce(p_action, '')));
  if v_action not in ('approve', 'reject') then
    raise exception 'INVALID_ACTION';
  end if;

  select * into v_payment
  from public.subscription_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status is distinct from 'pending' then
    raise exception 'PAYMENT_NOT_PENDING';
  end if;

  select * into v_org
  from public.organizations
  where id = v_payment.organization_id
  for update;

  if not found then
    raise exception 'ORGANIZATION_NOT_FOUND';
  end if;

  if v_action = 'approve' then
    update public.subscription_payments
    set
      status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_uid,
      rejection_reason = null,
      updated_at = now()
    where id = p_payment_id;

    update public.organizations
    set
      subscription_status = 'active',
      is_active = true,
      status = 'active',
      approved_at = now(),
      approved_by = v_uid,
      payment_rejection_reason = null,
      updated_at = now()
    where id = v_org.id;

    perform public.create_notification(
      v_org.owner_id,
      'SUBSCRIPTION_APPROVED',
      'Your Business Is Live!',
      'Your MeriBaari subscription payment has been received successfully. Thank you for becoming part of the MeriBaari family! Your business is now live and visible to customers. We are excited to have you with us.',
      'SUBSCRIPTION_APPROVED:' || p_payment_id::text,
      null,
      null,
      v_org.id
    );
  else
    v_reason := trim(coalesce(p_rejection_reason, ''));
    if length(v_reason) = 0 then
      raise exception 'REJECTION_REASON_REQUIRED';
    end if;

    update public.subscription_payments
    set
      status = 'rejected',
      reviewed_at = now(),
      reviewed_by = v_uid,
      rejection_reason = v_reason,
      updated_at = now()
    where id = p_payment_id;

    update public.organizations
    set
      subscription_status = 'rejected',
      is_active = false,
      status = 'inactive',
      payment_rejection_reason = v_reason,
      updated_at = now()
    where id = v_org.id;

    perform public.create_notification(
      v_org.owner_id,
      'SUBSCRIPTION_REJECTED',
      'Payment Verification Update',
      'We couldn''t verify your payment at this time. Please review the reason below and submit your payment proof again. Reason: '
        || v_reason,
      'SUBSCRIPTION_REJECTED:' || p_payment_id::text,
      null,
      null,
      v_org.id
    );
  end if;

  return p_payment_id;
end;
$$;

create or replace function public.get_admin_subscription_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pending integer := 0;
  v_approved_payments integer := 0;
  v_rejected integer := 0;
  v_active integer := 0;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select count(*)::integer into v_pending
  from public.subscription_payments
  where status = 'pending';

  select count(*)::integer into v_approved_payments
  from public.subscription_payments
  where status = 'approved';

  select count(*)::integer into v_rejected
  from public.subscription_payments
  where status = 'rejected';

  select count(*)::integer into v_active
  from public.organizations
  where subscription_status = 'active';

  return jsonb_build_object(
    'pendingPayments', v_pending,
    'approvedPayments', v_approved_payments,
    'rejectedPayments', v_rejected,
    'activeBusinesses', v_active
  );
end;
$$;

revoke all on function public.submit_subscription_payment(
  uuid, public.subscription_payment_method, text, numeric, text
) from public;
grant execute on function public.submit_subscription_payment(
  uuid, public.subscription_payment_method, text, numeric, text
) to authenticated;

revoke all on function public.review_subscription_payment(uuid, text, text) from public;
grant execute on function public.review_subscription_payment(uuid, text, text) to authenticated;

revoke all on function public.get_admin_subscription_stats() from public;
grant execute on function public.get_admin_subscription_stats() to authenticated;
