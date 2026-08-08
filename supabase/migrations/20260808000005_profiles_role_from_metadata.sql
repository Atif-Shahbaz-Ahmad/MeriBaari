-- Backfill role from auth user metadata on signup (customer | business only).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  resolved_role public.user_role;
begin
  meta_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  if meta_role in ('customer', 'business') then
    resolved_role := meta_role::public.user_role;
  else
    resolved_role := null;
  end if;

  insert into public.profiles (id, full_name, phone, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    resolved_role
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    email = coalesce(excluded.email, public.profiles.email),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    role = coalesce(public.profiles.role, excluded.role),
    updated_at = now();
  return new;
end;
$$;
