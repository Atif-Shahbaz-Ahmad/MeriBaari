-- Departments & services enrichment + tightened RLS
-- Adds description/icon/is_active/display_order for departments
-- Adds price/is_active/display_order for services
-- Customers only see active rows under active organizations

-- ---------------------------------------------------------------------------
-- Departments columns
-- ---------------------------------------------------------------------------

alter table public.departments
  add column if not exists description text not null default '',
  add column if not exists icon text not null default 'users',
  add column if not exists is_active boolean not null default true,
  add column if not exists display_order integer not null default 0;

alter table public.departments
  drop constraint if exists departments_icon_check;

alter table public.departments
  add constraint departments_icon_check
  check (
    icon in (
      'stethoscope',
      'heart',
      'tooth',
      'eye',
      'siren',
      'scan',
      'flask',
      'users',
      'file',
      'car'
    )
  );

create index if not exists departments_is_active_idx
  on public.departments (is_active);

create index if not exists departments_org_active_order_idx
  on public.departments (organization_id, is_active, display_order);

-- ---------------------------------------------------------------------------
-- Services columns
-- ---------------------------------------------------------------------------

alter table public.services
  add column if not exists price numeric(12, 2)
    check (price is null or price >= 0),
  add column if not exists is_active boolean not null default true,
  add column if not exists display_order integer not null default 0;

create index if not exists services_is_active_idx
  on public.services (is_active);

create index if not exists services_dept_active_order_idx
  on public.services (department_id, is_active, display_order);

-- ---------------------------------------------------------------------------
-- Sync is_active ↔ status (keep existing enum for compatibility)
-- ---------------------------------------------------------------------------

create or replace function public.sync_department_active_status()
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

drop trigger if exists departments_sync_active_status on public.departments;
create trigger departments_sync_active_status
  before insert or update on public.departments
  for each row execute function public.sync_department_active_status();

create or replace function public.sync_service_active_status()
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

drop trigger if exists services_sync_active_status on public.services;
create trigger services_sync_active_status
  before insert or update on public.services
  for each row execute function public.sync_service_active_status();

-- ---------------------------------------------------------------------------
-- RLS — replace permissive public reads with active + ownership rules
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can read departments" on public.departments;
drop policy if exists "Org staff can manage departments" on public.departments;
drop policy if exists "Authenticated can read active or owned departments"
  on public.departments;
drop policy if exists "Owners can manage own departments" on public.departments;

drop policy if exists "Authenticated can read services" on public.services;
drop policy if exists "Org staff can manage services" on public.services;
drop policy if exists "Authenticated can read active or owned services"
  on public.services;
drop policy if exists "Owners can manage own services" on public.services;

-- Departments: public active under active orgs; owners see all their rows
create policy "Authenticated can read active or owned departments"
  on public.departments
  for select
  to authenticated
  using (
    (
      is_active = true
      and status = 'active'
      and exists (
        select 1
        from public.organizations o
        where o.id = departments.organization_id
          and o.is_active = true
          and o.status = 'active'
      )
    )
    or public.is_org_owner(organization_id)
    or public.is_org_member(organization_id)
  );

create policy "Owners can manage own departments"
  on public.departments
  for all
  to authenticated
  using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));

-- Services: active under active department + active org; owners manage via dept org
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
        join public.organizations o on o.id = d.organization_id
        where d.id = services.department_id
          and d.is_active = true
          and d.status = 'active'
          and o.is_active = true
          and o.status = 'active'
      )
    )
    or exists (
      select 1
      from public.departments d
      where d.id = services.department_id
        and (
          public.is_org_owner(d.organization_id)
          or public.is_org_member(d.organization_id)
        )
    )
  );

create policy "Owners can manage own services"
  on public.services
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.departments d
      where d.id = services.department_id
        and public.is_org_owner(d.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.departments d
      where d.id = services.department_id
        and public.is_org_owner(d.organization_id)
    )
  );
