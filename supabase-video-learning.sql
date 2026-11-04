-- Run in Supabase SQL Editor for your project.
-- Authenticated students can publish immediately; no admin approval is used.
create table if not exists public.video_lessons (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 120),
 subject text not null check(char_length(subject) between 1 and 80),
 topic text not null check(char_length(topic) between 1 and 120),
 source_type text not null check(source_type in ('youtube','upload')),
 youtube_id text, storage_path text, mime_type text, created_at timestamptz not null default now(),
 constraint video_source_valid check (
 (source_type='youtube' and youtube_id is not null and storage_path is null) or
 (source_type='upload' and storage_path is not null and youtube_id is null))
);
alter table public.video_lessons enable row level security;
drop policy if exists "Authenticated students can view lessons" on public.video_lessons;
create policy "Authenticated students can view lessons" on public.video_lessons for select to authenticated using(true);
drop policy if exists "Students publish own lessons" on public.video_lessons;
create policy "Students publish own lessons" on public.video_lessons for insert to authenticated with check(auth.uid()=user_id);
drop policy if exists "Students update own lessons" on public.video_lessons;
create policy "Students update own lessons" on public.video_lessons for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Students delete own lessons" on public.video_lessons;
create policy "Students delete own lessons" on public.video_lessons for delete to authenticated using(auth.uid()=user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('video-lessons','video-lessons',false,104857600,array['video/mp4','video/webm','video/ogg','video/quicktime'])
on conflict(id) do update set public=false,file_size_limit=104857600,allowed_mime_types=array['video/mp4','video/webm','video/ogg','video/quicktime'];
drop policy if exists "Authenticated students read video files" on storage.objects;
create policy "Authenticated students read video files" on storage.objects for select to authenticated using(bucket_id='video-lessons');
drop policy if exists "Students upload own video files" on storage.objects;
create policy "Students upload own video files" on storage.objects for insert to authenticated with check(bucket_id='video-lessons' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Students delete own video files" on storage.objects;
create policy "Students delete own video files" on storage.objects for delete to authenticated using(bucket_id='video-lessons' and (storage.foldername(name))[1]=auth.uid()::text);
