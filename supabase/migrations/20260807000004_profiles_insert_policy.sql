-- Allow authenticated users to insert their own profile row.
-- handle_new_user() already inserts via SECURITY DEFINER; this covers
-- client-side ProfileRepository.ensure() when the trigger row is missing.

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);
