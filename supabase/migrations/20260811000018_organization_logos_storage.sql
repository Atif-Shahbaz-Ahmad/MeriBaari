-- Organization logo storage bucket.
-- Path convention: organizations/{organization_id}/logo.jpg
-- Public read; only the organization owner may write/update/delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-logos',
  'organization-logos',
  true,
  2097152, -- 2 MB (client uploads optimized ~512px JPEG)
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (logos appear on cards / search / dashboards)
drop policy if exists "Organization logos are publicly accessible" on storage.objects;
create policy "Organization logos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'organization-logos');

-- Owners may upload only into their organization folder
drop policy if exists "Owners can upload organization logos" on storage.objects;
create policy "Owners can upload organization logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = 'organizations'
    and public.is_org_owner(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Owners can update organization logos" on storage.objects;
create policy "Owners can update organization logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = 'organizations'
    and public.is_org_owner(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = 'organizations'
    and public.is_org_owner(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Owners can delete organization logos" on storage.objects;
create policy "Owners can delete organization logos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = 'organizations'
    and public.is_org_owner(((storage.foldername(name))[2])::uuid)
  );
