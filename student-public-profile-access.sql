-- My Study Station: privacy-safe student profiles
-- FIX: creates the missing profile_visibility table before using it.
-- Run this complete file once in the correct Supabase project.
-- Existing student-reels videos and the private profile-photo bucket are preserved.

begin;

-- 1. Create the student's own privacy preferences table.
create table if not exists public.profile_visibility (
  user_id uuid primary key references auth.users(id) on delete cascade,
  show_profile_photo boolean not null default false,
  show_display_name boolean not null default false,
  show_achievements boolean not null default false,
  show_approved_uploads boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Keep the migration safe if a partially-created table already exists.
alter table public.profile_visibility
  add column if not exists show_profile_photo boolean not null default false,
  add column if not exists show_display_name boolean not null default false,
  add column if not exists show_achievements boolean not null default false,
  add column if not exists show_approved_uploads boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profile_visibility enable row level security;

revoke all on table public.profile_visibility from public, anon;
grant select, insert, update on table public.profile_visibility to authenticated;

drop policy if exists "Students read their own profile visibility" on public.profile_visibility;
create policy "Students read their own profile visibility"
on public.profile_visibility for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Students create their own profile visibility" on public.profile_visibility;
create policy "Students create their own profile visibility"
on public.profile_visibility for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Students update their own profile visibility" on public.profile_visibility;
create policy "Students update their own profile visibility"
on public.profile_visibility for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- 2. Return only explicitly approved public profile fields.
-- Email, phone, DOB, school, membership, payment, security and private learning
-- records are deliberately excluded.
create or replace function public.get_public_student_profiles(target_user_ids uuid[])
returns table (
  user_id uuid,
  display_name text,
  show_profile_photo boolean,
  show_approved_uploads boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id as user_id,
    case when coalesce(pv.show_display_name, false)
      then nullif(btrim(p.display_name), '')
      else null
    end as display_name,
    coalesce(pv.show_profile_photo, false) as show_profile_photo,
    coalesce(pv.show_approved_uploads, false) as show_approved_uploads
  from public.profiles as p
  left join public.profile_visibility as pv on pv.user_id = p.id
  where p.id = any(coalesce(target_user_ids, array[]::uuid[]));
$$;

revoke all on function public.get_public_student_profiles(uuid[]) from public, anon;
grant execute on function public.get_public_student_profiles(uuid[]) to authenticated;

-- 3. Permit viewing another student's photo only when they opted in.
create or replace function public.can_view_student_profile_photo(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select pv.show_profile_photo
    from public.profile_visibility as pv
    where pv.user_id = target_user_id
  ), false);
$$;

revoke all on function public.can_view_student_profile_photo(uuid) from public, anon;
grant execute on function public.can_view_student_profile_photo(uuid) to authenticated;

drop policy if exists "Students read visible profile photos" on storage.objects;
create policy "Students read visible profile photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'student-profile-photos'
  and public.can_view_student_profile_photo(((storage.foldername(name))[1])::uuid)
);

commit;
