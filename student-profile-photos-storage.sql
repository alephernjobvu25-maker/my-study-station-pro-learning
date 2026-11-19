-- My Study Station: private student profile-picture storage
-- Review this migration before running it in the Supabase SQL Editor.
-- It creates a separate PRIVATE bucket and limits every operation to the
-- signed-in student's own first-level folder. No existing bucket is changed.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-profile-photos',
  'student-profile-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];

drop policy if exists "Students read own profile photos" on storage.objects;
create policy "Students read own profile photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'student-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Students upload own profile photos" on storage.objects;
create policy "Students upload own profile photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'student-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Students update own profile photos" on storage.objects;
create policy "Students update own profile photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'student-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'student-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Students delete own profile photos" on storage.objects;
create policy "Students delete own profile photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'student-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
