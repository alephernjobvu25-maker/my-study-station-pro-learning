-- My Study Station: Basic/Pro learning add-on schema
-- Review this script before running it in Supabase SQL Editor.
-- It assumes the existing public.is_platform_admin() security-definer function exists.
-- No service-role key is required or used by the website.

-- -----------------------------------------------------------------------------
-- Student notifications: each student can read their own notifications only.
-- Admins can create notifications; students can update only read_at.
-- -----------------------------------------------------------------------------
create table if not exists public.student_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '' check (char_length(body) <= 2000),
  category text not null default 'announcement'
    check (category in ('announcement','learning','account','membership','achievement')),
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.student_notifications enable row level security;
drop policy if exists "Students read own notifications" on public.student_notifications;
create policy "Students read own notifications" on public.student_notifications
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Students mark own notifications read" on public.student_notifications;
create policy "Students mark own notifications read" on public.student_notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Platform admins create notifications" on public.student_notifications;
create policy "Platform admins create notifications" on public.student_notifications
  for insert to authenticated with check (public.is_platform_admin());
revoke all on public.student_notifications from anon;
grant select, insert on public.student_notifications to authenticated;
revoke update on public.student_notifications from authenticated;
grant update (read_at) on public.student_notifications to authenticated;

-- -----------------------------------------------------------------------------
-- Notification preferences. Account/security alerts remain enabled by design.
-- -----------------------------------------------------------------------------
create table if not exists public.student_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  allow_announcements boolean not null default true,
  allow_learning boolean not null default true,
  allow_membership boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.student_notification_preferences enable row level security;
drop policy if exists "Students read own notification preferences" on public.student_notification_preferences;
create policy "Students read own notification preferences" on public.student_notification_preferences
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Students insert own notification preferences" on public.student_notification_preferences;
create policy "Students insert own notification preferences" on public.student_notification_preferences
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Students update own notification preferences" on public.student_notification_preferences;
create policy "Students update own notification preferences" on public.student_notification_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.student_notification_preferences from anon;
grant select,insert,update on public.student_notification_preferences to authenticated;

-- -----------------------------------------------------------------------------
-- Privacy preferences. These are private settings, not a public profile endpoint.
-- A later public-profile feature must expose only the opted-in fields via a
-- carefully scoped view/RPC; do not grant other students direct table access.
-- -----------------------------------------------------------------------------
create table if not exists public.profile_visibility (
  user_id uuid primary key references auth.users(id) on delete cascade,
  show_profile_photo boolean not null default false,
  show_display_name boolean not null default false,
  show_achievements boolean not null default false,
  show_approved_uploads boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.profile_visibility enable row level security;
drop policy if exists "Students read own visibility settings" on public.profile_visibility;
create policy "Students read own visibility settings" on public.profile_visibility
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Students insert own visibility settings" on public.profile_visibility;
create policy "Students insert own visibility settings" on public.profile_visibility
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Students update own visibility settings" on public.profile_visibility;
create policy "Students update own visibility settings" on public.profile_visibility
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.profile_visibility from anon;
grant select, insert, update on public.profile_visibility to authenticated;

-- -----------------------------------------------------------------------------
-- Moderated Reels. Existing uploads are marked pending until reviewed.
-- -----------------------------------------------------------------------------
create table if not exists public.video_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  subject text not null check (char_length(subject) between 1 and 80),
  topic text not null check (char_length(topic) between 1 and 120),
  source_type text not null check (source_type in ('youtube','upload')),
  youtube_id text,
  storage_path text,
  mime_type text,
  created_at timestamptz not null default now(),
  constraint video_source_valid check (
    (source_type = 'youtube' and youtube_id is not null and storage_path is null) or
    (source_type = 'upload' and storage_path is not null and youtube_id is null)
  )
);
alter table public.video_lessons add column if not exists approval_status text not null default 'pending';
alter table public.video_lessons add column if not exists approved_by uuid references auth.users(id) on delete set null;
alter table public.video_lessons add column if not exists approved_at timestamptz;
alter table public.video_lessons add column if not exists content_level text not null default 'standard';
alter table public.video_lessons drop constraint if exists video_lessons_approval_status_check;
alter table public.video_lessons add constraint video_lessons_approval_status_check
  check (approval_status in ('pending','approved','rejected'));
alter table public.video_lessons drop constraint if exists video_lessons_content_level_check;
alter table public.video_lessons add constraint video_lessons_content_level_check
  check (content_level in ('standard','advanced'));

-- Database-side Pro entitlement check. It evaluates only the signed-in user and
-- uses the latest membership record, so an older active row cannot unlock Pro.
create or replace function public.is_pro_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select lower(coalesce(m.status,'')) = 'active' and m.expires_at > now()
    from public.memberships m
    where m.user_id = auth.uid()
    order by m.created_at desc
    limit 1
  ), false);
$$;
revoke all on function public.is_pro_member() from public, anon;
grant execute on function public.is_pro_member() to authenticated;

alter table public.video_lessons enable row level security;
drop policy if exists "Authenticated students can view lessons" on public.video_lessons;
drop policy if exists "Students publish own lessons" on public.video_lessons;
drop policy if exists "Students update own lessons" on public.video_lessons;
drop policy if exists "Students delete own lessons" on public.video_lessons;
drop policy if exists "Students read approved lessons or own submissions" on public.video_lessons;
drop policy if exists "Students submit pending lessons" on public.video_lessons;
drop policy if exists "Students update own pending lessons" on public.video_lessons;
drop policy if exists "Students delete own unapproved lessons" on public.video_lessons;
drop policy if exists "Platform admins read all lessons" on public.video_lessons;
drop policy if exists "Platform admins moderate lessons" on public.video_lessons;
drop policy if exists "Platform admins delete lessons" on public.video_lessons;
create policy "Students read approved lessons or own submissions" on public.video_lessons
  for select to authenticated using ((approval_status = 'approved' and (content_level = 'standard' or public.is_pro_member())) or auth.uid() = user_id or public.is_platform_admin());
create policy "Students submit pending lessons" on public.video_lessons
  for insert to authenticated with check (auth.uid() = user_id and approval_status = 'pending' and approved_by is null and approved_at is null and (content_level = 'standard' or public.is_pro_member()));
create policy "Students update own pending lessons" on public.video_lessons
  for update to authenticated using (auth.uid() = user_id and approval_status = 'pending')
  with check (auth.uid() = user_id and approval_status = 'pending' and approved_by is null and approved_at is null and (content_level = 'standard' or public.is_pro_member()));
create policy "Students delete own unapproved lessons" on public.video_lessons
  for delete to authenticated using (auth.uid() = user_id and approval_status in ('pending','rejected'));
create policy "Platform admins moderate lessons" on public.video_lessons
  for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "Platform admins delete lessons" on public.video_lessons
  for delete to authenticated using (public.is_platform_admin());
revoke all on public.video_lessons from anon;
grant select, insert, update, delete on public.video_lessons to authenticated;

-- Private video storage. Only the uploader, approved lesson viewers and admins
-- can obtain signed URLs. Existing broad read policy is removed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video-lessons','video-lessons',false,104857600,array['video/mp4','video/webm','video/ogg','video/quicktime'])
on conflict (id) do update set public=false,file_size_limit=104857600,allowed_mime_types=array['video/mp4','video/webm','video/ogg','video/quicktime'];
drop policy if exists "Authenticated students read video files" on storage.objects;
drop policy if exists "Students upload own video files" on storage.objects;
drop policy if exists "Students delete own video files" on storage.objects;
drop policy if exists "Read approved or own lesson video files" on storage.objects;
drop policy if exists "Upload own lesson video files" on storage.objects;
drop policy if exists "Delete own unapproved lesson video files" on storage.objects;
create policy "Read approved or own lesson video files" on storage.objects
  for select to authenticated using (
    bucket_id = 'video-lessons' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_platform_admin()
      or exists (select 1 from public.video_lessons vl where vl.storage_path = name and vl.approval_status = 'approved')
    )
  );
create policy "Upload own lesson video files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'video-lessons' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Delete own unapproved lesson video files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'video-lessons' and (storage.foldername(name))[1] = auth.uid()::text
    and (not exists (select 1 from public.video_lessons vl where vl.storage_path = name and vl.approval_status = 'approved') or public.is_platform_admin())
  );

-- Reels likes.
create table if not exists public.video_reactions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.video_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(video_id,user_id)
);
alter table public.video_reactions enable row level security;
drop policy if exists "Students read reactions on approved videos" on public.video_reactions;
drop policy if exists "Students like approved videos" on public.video_reactions;
drop policy if exists "Students remove own likes" on public.video_reactions;
create policy "Students read reactions on approved videos" on public.video_reactions for select to authenticated
  using (exists(select 1 from public.video_lessons vl where vl.id=video_id and vl.approval_status='approved'));
create policy "Students like approved videos" on public.video_reactions for insert to authenticated
  with check (auth.uid()=user_id and exists(select 1 from public.video_lessons vl where vl.id=video_id and vl.approval_status='approved'));
create policy "Students remove own likes" on public.video_reactions for delete to authenticated using (auth.uid()=user_id);
revoke all on public.video_reactions from anon;
grant select,insert,delete on public.video_reactions to authenticated;

-- Reels comments.
create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.video_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.video_comments add column if not exists approval_status text not null default 'pending';
alter table public.video_comments add column if not exists approved_by uuid references auth.users(id) on delete set null;
alter table public.video_comments add column if not exists approved_at timestamptz;
alter table public.video_comments drop constraint if exists video_comments_approval_status_check;
alter table public.video_comments add constraint video_comments_approval_status_check check (approval_status in ('pending','approved','rejected'));
alter table public.video_comments enable row level security;
drop policy if exists "Students read comments on approved videos" on public.video_comments;
drop policy if exists "Students comment on approved videos" on public.video_comments;
drop policy if exists "Students delete own comments" on public.video_comments;
drop policy if exists "Students read approved comments or own pending comments" on public.video_comments;
drop policy if exists "Students submit pending comments" on public.video_comments;
drop policy if exists "Students delete own unapproved comments" on public.video_comments;
drop policy if exists "Students delete own comments" on public.video_comments;
drop policy if exists "Platform admins moderate comments" on public.video_comments;
create policy "Students read approved comments or own pending comments" on public.video_comments for select to authenticated
  using ((approval_status='approved' and exists(select 1 from public.video_lessons vl where vl.id=video_id and vl.approval_status='approved')) or auth.uid()=user_id or public.is_platform_admin());
create policy "Students submit pending comments" on public.video_comments for insert to authenticated
  with check (auth.uid()=user_id and approval_status='pending' and approved_by is null and approved_at is null and exists(select 1 from public.video_lessons vl where vl.id=video_id and vl.approval_status='approved'));
create policy "Students delete own comments" on public.video_comments for delete to authenticated using (auth.uid()=user_id or public.is_platform_admin());
create policy "Platform admins moderate comments" on public.video_comments for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.video_comments from anon;
grant select,insert,update,delete on public.video_comments to authenticated;

-- Private saved Reels.
create table if not exists public.video_bookmarks (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.video_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(video_id,user_id)
);
alter table public.video_bookmarks enable row level security;
drop policy if exists "Students read own bookmarks" on public.video_bookmarks;
drop policy if exists "Students bookmark approved videos" on public.video_bookmarks;
drop policy if exists "Students remove own bookmarks" on public.video_bookmarks;
create policy "Students read own bookmarks" on public.video_bookmarks for select to authenticated using (auth.uid()=user_id);
create policy "Students bookmark approved videos" on public.video_bookmarks for insert to authenticated
  with check (auth.uid()=user_id and exists(select 1 from public.video_lessons vl where vl.id=video_id and vl.approval_status='approved'));
create policy "Students remove own bookmarks" on public.video_bookmarks for delete to authenticated using (auth.uid()=user_id);
revoke all on public.video_bookmarks from anon;
grant select,insert,delete on public.video_bookmarks to authenticated;

-- Private reports. Only the reporter and platform admins can read a report.
create table if not exists public.video_reports (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.video_lessons(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.video_reports add column if not exists status text not null default 'pending';
alter table public.video_reports add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.video_reports add column if not exists reviewed_at timestamptz;
alter table public.video_reports drop constraint if exists video_reports_status_check;
alter table public.video_reports add constraint video_reports_status_check check (status in ('pending','reviewed'));
alter table public.video_reports enable row level security;
drop policy if exists "Students report approved videos" on public.video_reports;
drop policy if exists "Reporters and admins read reports" on public.video_reports;
drop policy if exists "Platform admins update reports" on public.video_reports;
create policy "Students report approved videos" on public.video_reports for insert to authenticated
  with check (auth.uid()=reporter_id and exists(select 1 from public.video_lessons vl where vl.id=video_id and vl.approval_status='approved'));
create policy "Reporters and admins read reports" on public.video_reports for select to authenticated
  using (auth.uid()=reporter_id or public.is_platform_admin());
create policy "Platform admins update reports" on public.video_reports for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.video_reports from anon;
grant select,insert,update on public.video_reports to authenticated;

-- Useful indexes for feeds and notification inboxes.
create index if not exists student_notifications_user_created_idx on public.student_notifications(user_id,created_at desc);
create index if not exists video_lessons_approval_created_idx on public.video_lessons(approval_status,created_at desc);
create index if not exists video_lessons_user_idx on public.video_lessons(user_id,created_at desc);
create index if not exists video_comments_video_created_idx on public.video_comments(video_id,created_at);
create index if not exists video_comments_moderation_idx on public.video_comments(approval_status,created_at);

-- IMPORTANT: This script does not expose profile_visibility or private student
-- profile fields to other students. Public profile access needs a separate
-- restricted view/RPC after its exact fields and policies are reviewed.
