-- MeriBaari Row Level Security
-- Customers: own data only
-- Business members: organization-scoped data
-- Future staff roles use organization_members.role

-- ---------------------------------------------------------------------------
-- Helper functions (security definer for use inside policies)
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
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
  select exists (
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
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'manager')
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.organization_members enable row level security;
alter table public.departments enable row level security;
alter table public.services enable row level security;
alter table public.queues enable row level security;
alter table public.queue_entries enable row level security;
alter table public.tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.business_settings enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Org staff can read profiles of customers currently in their queues
create policy "Org staff can read queue customer profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.queue_entries qe
      join public.queues q on q.id = qe.queue_id
      join public.departments d on d.id = q.department_id
      where qe.customer_id = profiles.id
        and public.is_org_staff(d.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- organizations (public read for discovery; write for members)
-- ---------------------------------------------------------------------------

create policy "Anyone authenticated can list active organizations"
  on public.organizations for select
  to authenticated
  using (status = 'active' or public.is_org_member(id));

create policy "Org owners/managers can update organization"
  on public.organizations for update
  using (public.is_org_owner_or_manager(id))
  with check (public.is_org_owner_or_manager(id));

create policy "Authenticated users can create organizations"
  on public.organizations for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- branches
-- ---------------------------------------------------------------------------

create policy "Members can read branches"
  on public.branches for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = branches.organization_id
        and (o.status = 'active' or public.is_org_member(o.id))
    )
  );

create policy "Owners/managers can manage branches"
  on public.branches for all
  using (public.is_org_owner_or_manager(organization_id))
  with check (public.is_org_owner_or_manager(organization_id));

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------

create policy "Members can read membership of their orgs"
  on public.organization_members for select
  using (
    user_id = auth.uid()
    or public.is_org_member(organization_id)
  );

create policy "Owners/managers can insert members"
  on public.organization_members for insert
  with check (public.is_org_owner_or_manager(organization_id));

create policy "Owners/managers can update members"
  on public.organization_members for update
  using (public.is_org_owner_or_manager(organization_id))
  with check (public.is_org_owner_or_manager(organization_id));

create policy "Owners/managers can delete members"
  on public.organization_members for delete
  using (public.is_org_owner_or_manager(organization_id));

-- Allow creator to add themselves as owner when creating an org
create policy "Users can insert themselves as owner"
  on public.organization_members for insert
  with check (user_id = auth.uid() and role = 'owner');

-- ---------------------------------------------------------------------------
-- departments / services / queues — public read for join-queue; staff write
-- ---------------------------------------------------------------------------

create policy "Authenticated can read departments"
  on public.departments for select
  to authenticated
  using (true);

create policy "Org staff can manage departments"
  on public.departments for all
  using (public.is_org_staff(organization_id))
  with check (public.is_org_staff(organization_id));

create policy "Authenticated can read services"
  on public.services for select
  to authenticated
  using (true);

create policy "Org staff can manage services"
  on public.services for all
  using (
    exists (
      select 1 from public.departments d
      where d.id = services.department_id
        and public.is_org_staff(d.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.departments d
      where d.id = services.department_id
        and public.is_org_staff(d.organization_id)
    )
  );

create policy "Authenticated can read queues"
  on public.queues for select
  to authenticated
  using (true);

create policy "Org staff can manage queues"
  on public.queues for all
  using (
    exists (
      select 1 from public.departments d
      where d.id = queues.department_id
        and public.is_org_staff(d.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.departments d
      where d.id = queues.department_id
        and public.is_org_staff(d.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- queue_entries
-- ---------------------------------------------------------------------------

create policy "Customers can read own queue entries"
  on public.queue_entries for select
  using (customer_id = auth.uid());

create policy "Org staff can read org queue entries"
  on public.queue_entries for select
  using (
    exists (
      select 1
      from public.queues q
      join public.departments d on d.id = q.department_id
      where q.id = queue_entries.queue_id
        and public.is_org_staff(d.organization_id)
    )
  );

create policy "Customers can join queues"
  on public.queue_entries for insert
  to authenticated
  with check (customer_id = auth.uid() or customer_id is null);

create policy "Customers can cancel own waiting entries"
  on public.queue_entries for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "Org staff can manage queue entries"
  on public.queue_entries for all
  using (
    exists (
      select 1
      from public.queues q
      join public.departments d on d.id = q.department_id
      where q.id = queue_entries.queue_id
        and public.is_org_staff(d.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.queues q
      join public.departments d on d.id = q.department_id
      where q.id = queue_entries.queue_id
        and public.is_org_staff(d.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- tickets
-- ---------------------------------------------------------------------------

create policy "Customers can read own tickets"
  on public.tickets for select
  using (
    exists (
      select 1 from public.queue_entries qe
      where qe.id = tickets.queue_entry_id
        and qe.customer_id = auth.uid()
    )
  );

create policy "Org staff can read org tickets"
  on public.tickets for select
  using (
    exists (
      select 1
      from public.queue_entries qe
      join public.queues q on q.id = qe.queue_id
      join public.departments d on d.id = q.department_id
      where qe.id = tickets.queue_entry_id
        and public.is_org_staff(d.organization_id)
    )
  );

create policy "Authenticated can create tickets for accessible entries"
  on public.tickets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.queue_entries qe
      where qe.id = queue_entry_id
        and (
          qe.customer_id = auth.uid()
          or exists (
            select 1
            from public.queues q
            join public.departments d on d.id = q.department_id
            where q.id = qe.queue_id
              and public.is_org_staff(d.organization_id)
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Inserts typically come from service role / edge functions
create policy "Users cannot insert arbitrary notifications"
  on public.notifications for insert
  with check (false);

-- ---------------------------------------------------------------------------
-- business_settings
-- ---------------------------------------------------------------------------

create policy "Org members can read settings"
  on public.business_settings for select
  using (public.is_org_member(organization_id));

create policy "Owners/managers can update settings"
  on public.business_settings for update
  using (public.is_org_owner_or_manager(organization_id))
  with check (public.is_org_owner_or_manager(organization_id));

create policy "Owners/managers can insert settings"
  on public.business_settings for insert
  with check (public.is_org_owner_or_manager(organization_id));
