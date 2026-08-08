-- MeriBaari initial schema
-- Production-ready tables for customers, businesses, queues, tickets, notifications.
-- Branches are future-ready via nullable branch_id columns where noted.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('customer', 'business', 'staff', 'manager', 'admin');

create type public.organization_member_role as enum ('owner', 'manager', 'staff', 'viewer');

create type public.organization_status as enum ('active', 'inactive', 'suspended');

create type public.department_status as enum ('active', 'inactive', 'paused');

create type public.service_status as enum ('active', 'inactive', 'paused');

create type public.queue_status as enum ('active', 'paused', 'closed');

create type public.queue_entry_status as enum (
  'waiting',
  'called',
  'serving',
  'completed',
  'cancelled',
  'skipped',
  'missed'
);

create type public.notification_type as enum (
  'turn_soon',
  'turn_next',
  'queue_delayed',
  'queue_completed',
  'counter_changed',
  'queue_cancelled',
  'org_nearby',
  'joined',
  'reminder',
  'promo'
);

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  role public.user_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_phone_idx on public.profiles (phone);

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  description text not null default '',
  category text not null,
  address text not null default '',
  phone text,
  email text,
  working_hours text not null default '',
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_category_check check (char_length(category) > 0)
);

create index organizations_category_idx on public.organizations (category);
create index organizations_status_idx on public.organizations (status);

-- Future: branches under an organization
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  address text,
  phone text,
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now()
);

create index branches_organization_id_idx on public.branches (organization_id);

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------

create table public.organization_members (
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role public.organization_member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create index organization_members_org_idx on public.organization_members (organization_id);
create index organization_members_user_idx on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------------

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  name text not null,
  estimated_service_time integer not null default 10
    check (estimated_service_time > 0),
  status public.department_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index departments_organization_id_idx on public.departments (organization_id);
create index departments_branch_id_idx on public.departments (branch_id);

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  name text not null,
  description text not null default '',
  estimated_duration integer not null default 10
    check (estimated_duration > 0),
  status public.service_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_department_id_idx on public.services (department_id);

-- ---------------------------------------------------------------------------
-- queues
-- ---------------------------------------------------------------------------

create table public.queues (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  current_serving_number text not null default '',
  status public.queue_status not null default 'active',
  average_waiting_time integer not null default 0
    check (average_waiting_time >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index queues_department_id_idx on public.queues (department_id);
create index queues_status_idx on public.queues (status);

-- ---------------------------------------------------------------------------
-- queue_entries
-- ---------------------------------------------------------------------------

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues (id) on delete cascade,
  customer_id uuid references public.profiles (id) on delete set null,
  service_id uuid not null references public.services (id) on delete restrict,
  ticket_number text not null,
  position integer not null default 0 check (position >= 0),
  status public.queue_entry_status not null default 'waiting',
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  constraint queue_entries_ticket_unique unique (queue_id, ticket_number)
);

create index queue_entries_queue_id_idx on public.queue_entries (queue_id);
create index queue_entries_customer_id_idx on public.queue_entries (customer_id);
create index queue_entries_service_id_idx on public.queue_entries (service_id);
create index queue_entries_status_idx on public.queue_entries (status);
create index queue_entries_queue_status_idx on public.queue_entries (queue_id, status);

-- ---------------------------------------------------------------------------
-- tickets (QR wrappers)
-- ---------------------------------------------------------------------------

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  queue_entry_id uuid not null unique references public.queue_entries (id) on delete cascade,
  qr_code text not null unique,
  generated_at timestamptz not null default now()
);

create index tickets_queue_entry_id_idx on public.tickets (queue_entry_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  type public.notification_type not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_user_unread_idx on public.notifications (user_id, is_read)
  where is_read = false;
create index notifications_created_at_idx on public.notifications (created_at desc);

-- ---------------------------------------------------------------------------
-- business_settings
-- ---------------------------------------------------------------------------

create table public.business_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index business_settings_organization_id_idx on public.business_settings (organization_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create trigger queues_set_updated_at
  before update on public.queues
  for each row execute function public.set_updated_at();

create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on auth signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    null
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    email = coalesce(excluded.email, public.profiles.email),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
