-- Public bucket for profile photos (created automatically by the API if missing).
-- Run in Supabase SQL editor if you prefer manual setup:

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  400000,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set public = true;

create policy if not exists "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy if not exists "Service role write avatars"
  on storage.objects for all
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');
