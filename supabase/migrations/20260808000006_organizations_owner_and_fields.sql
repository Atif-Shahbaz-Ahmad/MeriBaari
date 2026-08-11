  -- Organizations ownership + discovery fields
  -- Aligns organizations with business ownership (owner_id → profiles.id)
  -- and public discovery via is_active.

  -- ---------------------------------------------------------------------------
  -- Columns
  -- ---------------------------------------------------------------------------

  alter table public.organizations
    rename column logo to logo_url;

  alter table public.organizations
    add column if not exists owner_id uuid references public.profiles (id) on delete cascade,
    add column if not exists city text not null default '',
    add column if not exists latitude double precision,
    add column if not exists longitude double precision,
    add column if not exists average_wait_time integer not null default 0
      check (average_wait_time >= 0),
    add column if not exists is_active boolean not null default true;

  -- One organization per business owner for now (multi-branch later).
  create unique index if not exists organizations_owner_id_unique
    on public.organizations (owner_id)
    where owner_id is not null;

  create index if not exists organizations_owner_id_idx
    on public.organizations (owner_id);

  create index if not exists organizations_is_active_idx
    on public.organizations (is_active);

  create index if not exists organizations_city_idx
    on public.organizations (city);

  -- Normalize legacy catalog categories before tightening the check
  update public.organizations
  set category = case category
    when 'hospitals' then 'clinic'
    when 'clinics' then 'clinic'
    when 'restaurants' then 'restaurant'
    when 'banks' then 'other'
    when 'government' then 'other'
    when 'universities' then 'other'
    when 'others' then 'other'
    else category
  end
  where category not in (
    'barber_shop',
    'clinic',
    'workshop',
    'salon',
    'restaurant',
    'pharmacy',
    'other'
  );

  alter table public.organizations
    drop constraint if exists organizations_category_check;

  alter table public.organizations
    add constraint organizations_category_check
    check (
      category in (
        'barber_shop',
        'clinic',
        'workshop',
        'salon',
        'restaurant',
        'pharmacy',
        'other'
      )
    );

  -- Keep status in sync with is_active for existing policies / enums
  create or replace function public.sync_organization_active_status()
  returns trigger
  language plpgsql
  as $$
  begin
    if tg_op = 'INSERT' then
      if new.is_active is distinct from true then
        new.status := 'inactive';
      elsif new.status is null then
        new.status := 'active';
      end if;
      return new;
    end if;

    -- UPDATE: prefer explicit is_active changes; otherwise mirror status
    if new.is_active is distinct from old.is_active then
      if new.is_active then
        if new.status = 'inactive' then
          new.status := 'active';
        end if;
      else
        if new.status = 'active' then
          new.status := 'inactive';
        end if;
      end if;
    elsif new.status is distinct from old.status then
      new.is_active := (new.status = 'active');
    end if;

    return new;
  end;
  $$;

  drop trigger if exists organizations_sync_active_status on public.organizations;
  create trigger organizations_sync_active_status
    before insert or update on public.organizations
    for each row execute function public.sync_organization_active_status();

  -- Auto-add creator as organization_members.owner (future staff/managers)
  create or replace function public.handle_organization_created()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    if new.owner_id is not null then
      insert into public.organization_members (user_id, organization_id, role)
      values (new.owner_id, new.id, 'owner')
      on conflict (user_id, organization_id) do nothing;
    end if;
    return new;
  end;
  $$;

  drop trigger if exists on_organization_created on public.organizations;
  create trigger on_organization_created
    after insert on public.organizations
    for each row execute function public.handle_organization_created();

  -- Ownership helpers also honor owner_id (not only membership rows)
  create or replace function public.is_org_owner(org_id uuid)
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
        and o.owner_id = auth.uid()
    );
  $$;

  create or replace function public.is_org_member(org_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select public.is_org_owner(org_id)
      or exists (
        select 1
        from public.organization_members m
        where m.organization_id = org_id
          and m.user_id = auth.uid()
      );
  $$;

  create or replace function public.is_org_staff(org_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select public.is_org_owner(org_id)
      or exists (
        select 1
        from public.organization_members m
        where m.organization_id = org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'manager', 'staff')
      );
  $$;

  create or replace function public.is_org_owner_or_manager(org_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select public.is_org_owner(org_id)
      or exists (
        select 1
        from public.organization_members m
        where m.organization_id = org_id
          and m.user_id = auth.uid()
          and m.role in ('owner', 'manager')
      );
  $$;

  -- ---------------------------------------------------------------------------
  -- RLS — replace permissive org policies with owner + active discovery rules
  -- ---------------------------------------------------------------------------

  drop policy if exists "Anyone authenticated can list active organizations"
    on public.organizations;
  drop policy if exists "Org owners/managers can update organization"
    on public.organizations;
  drop policy if exists "Authenticated users can create organizations"
    on public.organizations;
  drop policy if exists "Authenticated can read active or owned organizations"
    on public.organizations;
  drop policy if exists "Business can create own organization"
    on public.organizations;
  drop policy if exists "Owners can update own organization"
    on public.organizations;
  drop policy if exists "Owners can delete own organization"
    on public.organizations;

  -- Customers / any authenticated user: active orgs only.
  -- Owners / members: can also read inactive orgs they own/belong to.
  create policy "Authenticated can read active or owned organizations"
    on public.organizations
    for select
    to authenticated
    using (
      (is_active = true and status = 'active')
      or owner_id = auth.uid()
      or public.is_org_member(id)
    );

  -- Only business profiles may create, and only as themselves.
  create policy "Business can create own organization"
    on public.organizations
    for insert
    to authenticated
    with check (
      owner_id = auth.uid()
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'business'
      )
    );

  -- Owners manage their own row (including activate / deactivate).
  create policy "Owners can update own organization"
    on public.organizations
    for update
    to authenticated
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

  create policy "Owners can delete own organization"
    on public.organizations
    for delete
    to authenticated
    using (owner_id = auth.uid());
