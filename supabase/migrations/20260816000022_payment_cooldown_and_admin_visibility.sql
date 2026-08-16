-- =============================================================================
-- 31-day cooldown after admin payment approval, and admin customer-visibility.
-- Admins can hide a live business for complaints, reviews, or conduct issues
-- without changing the owner's subscription record.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Admin visibility columns (owners cannot write these)
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column if not exists admin_hidden boolean not null default false,
  add column if not exists admin_hidden_reason text,
  add column if not exists admin_hidden_at timestamptz,
  add column if not exists admin_hidden_by uuid references public.profiles (id) on delete set null;

comment on column public.organizations.admin_hidden is
  'When true, customers cannot discover this business even if the subscription is active. Only admins may change this.';

create index if not exists organizations_admin_hidden_idx
  on public.organizations (admin_hidden)
  where admin_hidden = true;

-- ---------------------------------------------------------------------------
-- 2) Customer visibility helper
-- ---------------------------------------------------------------------------

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
      and o.admin_hidden = false
  );
$$;

-- ---------------------------------------------------------------------------
-- 3) Protect subscription + admin-visibility fields from owner writes
-- ---------------------------------------------------------------------------

create or replace function public.protect_organization_subscription_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('meribaari.bypass_subscription_protect', true) = 'on' then
    return new;
  end if;

  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.subscription_status := 'draft';
      new.approved_at := null;
      new.approved_by := null;
      new.subscription_submitted_at := null;
      new.payment_rejection_reason := null;
      new.admin_hidden := false;
      new.admin_hidden_reason := null;
      new.admin_hidden_at := null;
      new.admin_hidden_by := null;
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
      new.admin_hidden := old.admin_hidden;
      new.admin_hidden_reason := old.admin_hidden_reason;
      new.admin_hidden_at := old.admin_hidden_at;
      new.admin_hidden_by := old.admin_hidden_by;

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

-- ---------------------------------------------------------------------------
-- 4) Submit payment — 31-day cooldown from last admin approval
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
  v_last_approved timestamptz;
  v_next_eligible date;
  v_renewal boolean := false;
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

  if exists (
    select 1
    from public.subscription_payments sp
    where sp.organization_id = p_organization_id
      and sp.status = 'pending'
  ) then
    raise exception 'PAYMENT_ALREADY_PENDING';
  end if;

  select max(sp.reviewed_at) into v_last_approved
  from public.subscription_payments sp
  where sp.organization_id = p_organization_id
    and sp.status = 'approved';

  if v_last_approved is null then
    v_last_approved := v_org.approved_at;
  end if;

  if v_last_approved is not null
     and now() < v_last_approved + interval '31 days' then
    v_next_eligible := (v_last_approved + interval '31 days')::date;
    raise exception 'PAYMENT_COOLDOWN:%', v_next_eligible::text;
  end if;

  v_renewal := v_org.subscription_status = 'active';

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

  perform set_config('meribaari.bypass_subscription_protect', 'on', true);

  if v_renewal then
    update public.organizations
    set
      subscription_submitted_at = now(),
      payment_rejection_reason = null,
      updated_at = now()
    where id = p_organization_id;
  else
    update public.organizations
    set
      subscription_status = 'pending_approval',
      subscription_submitted_at = now(),
      payment_rejection_reason = null,
      is_active = false,
      status = 'inactive',
      updated_at = now()
    where id = p_organization_id;
  end if;

  select * into v_owner from public.profiles where id = v_uid;

  for v_admin in
    select id from public.profiles where role = 'admin'
  loop
    begin
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
    exception
      when others then
        null;
    end;
  end loop;

  return v_payment_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Review payment — renewal reject keeps a live business live
-- ---------------------------------------------------------------------------

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
  v_was_live boolean := false;
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

  v_was_live := v_org.subscription_status = 'active';

  perform set_config('meribaari.bypass_subscription_protect', 'on', true);

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

    begin
      perform public.create_notification(
        v_org.owner_id,
        'SUBSCRIPTION_APPROVED',
        'Your Business Is Live!',
        'Your MeriBaari subscription payment has been received successfully. Thank you for becoming part of the MeriBaari family! Your business is now live and visible to customers unless an administrator has hidden it. The next subscription payment can be submitted 31 days after this approval.',
        'SUBSCRIPTION_APPROVED:' || p_payment_id::text,
        null,
        null,
        v_org.id
      );
    exception
      when others then
        null;
    end;
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

    if v_was_live then
      update public.organizations
      set
        payment_rejection_reason = v_reason,
        updated_at = now()
      where id = v_org.id;
    else
      update public.organizations
      set
        subscription_status = 'rejected',
        is_active = false,
        status = 'inactive',
        payment_rejection_reason = v_reason,
        updated_at = now()
      where id = v_org.id;
    end if;

    begin
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
    exception
      when others then
        null;
    end;
  end if;

  return p_payment_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Admin hide / restore customer visibility
-- ---------------------------------------------------------------------------

create or replace function public.set_organization_admin_visibility(
  p_organization_id uuid,
  p_visible boolean,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations%rowtype;
  v_reason text;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if p_organization_id is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;

  select * into v_org
  from public.organizations
  where id = p_organization_id
  for update;

  if not found then
    raise exception 'ORGANIZATION_NOT_FOUND';
  end if;

  perform set_config('meribaari.bypass_subscription_protect', 'on', true);

  if p_visible then
    update public.organizations
    set
      admin_hidden = false,
      admin_hidden_reason = null,
      admin_hidden_at = null,
      admin_hidden_by = null,
      updated_at = now()
    where id = v_org.id;

    begin
      perform public.create_notification(
        v_org.owner_id,
        'SYSTEM',
        'Your business is visible again',
        'An administrator has restored your business so customers can find it again, as long as your subscription is active.',
        'BUSINESS_RESTORED:' || v_org.id::text || ':' || extract(epoch from now())::bigint::text,
        null,
        null,
        v_org.id
      );
    exception
      when others then
        null;
    end;
  else
    v_reason := trim(coalesce(p_reason, ''));
    if length(v_reason) = 0 then
      raise exception 'VISIBILITY_REASON_REQUIRED';
    end if;

    update public.organizations
    set
      admin_hidden = true,
      admin_hidden_reason = v_reason,
      admin_hidden_at = now(),
      admin_hidden_by = v_uid,
      updated_at = now()
    where id = v_org.id;

    begin
      perform public.create_notification(
        v_org.owner_id,
        'SYSTEM',
        'Your business is hidden from customers',
        'An administrator has hidden your business from customers due to complaints, reviews, or conduct issues. Reason: '
          || v_reason
          || ' Contact MeriBaari support if you believe this was a mistake.',
        'BUSINESS_HIDDEN:' || v_org.id::text || ':' || extract(epoch from now())::bigint::text,
        null,
        null,
        v_org.id
      );
    exception
      when others then
        null;
    end;
  end if;

  return v_org.id;
end;
$$;

revoke all on function public.set_organization_admin_visibility(uuid, boolean, text) from public;
grant execute on function public.set_organization_admin_visibility(uuid, boolean, text) to authenticated;
