-- Approve must not roll back if owner notification fails.
-- SECURITY DEFINER RPCs bypass subscription-field protection via a txn-local GUC.

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
        'Your MeriBaari subscription payment has been received successfully. Thank you for becoming part of the MeriBaari family! Your business is now live and visible to customers. We are excited to have you with us.',
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

    update public.organizations
    set
      subscription_status = 'rejected',
      is_active = false,
      status = 'inactive',
      payment_rejection_reason = v_reason,
      updated_at = now()
    where id = v_org.id;

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
