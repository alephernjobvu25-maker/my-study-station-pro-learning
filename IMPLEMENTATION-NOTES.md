# My Study Station — Integration and Design Notes

## Design direction
The Basic and Pro learning areas follow the saved design references:
- Basic: bright blue and white surfaces, blue gradients, soft gold accents, clear quick-access tiles and a welcoming learning banner.
- Pro: premium navy-blue surfaces, gold borders and accents, a membership summary, learning-progress summary, premium resource tiles and updates link.
- The shared Settings and student pages inherit the correct Basic or Pro visual identity through the page's `data-area`.
- The existing device-aware theme, font-size, contrast and reduced-motion preferences remain available.

The implementation is a responsive web adaptation of the reference designs. The screenshot mockups are design references, not flattened page backgrounds.

## Reels database integration
The Reels pages use the Stage A schema already installed by the user:
- `public.student_reels`
- private Storage bucket `student-reels`
- `access_tier` (`basic` / `pro`)
- `moderation_status` (`pending` / `approved` / `rejected`)
- `description`, `subject`, `topic`, `source_type`, `youtube_id`, `storage_path`, `mime_type`
- `reviewed_by`, `reviewed_at`, `rejection_reason`

Basic pages submit Basic Reels. Pro pages may submit Basic or Pro Reels when the user has an active Pro membership. Super Admin preview can inspect the areas, but database RLS remains authoritative. Only approved records appear in student feeds. Student uploads use signed URLs from the private bucket.

The Reels client intentionally does not assume likes, comments, bookmarks or reports tables exist. Those social features require a separate reviewed database stage.

## Existing lesson library
`video-learning.html` remains the Random Lesson Videos page and is separate from student Reels. It reads only published rows from the existing `video_lessons` table using its known columns:
- `lesson_title`
- `lesson_description`
- `topic_name`
- `duration_minutes`
- `video_provider`
- `video_url`
- `is_published`

It is read-only and does not alter `video_lessons` or the existing teacher/lesson library.

## Admin moderation
`reels-moderation.html` checks the signed-in account through `is_platform_admin()` and updates only pending `student_reels` records. Database RLS is the enforcement layer. `admin.html` links to this current moderation queue.

## Existing systems preserved
The package retains the original student authentication, Supabase client configuration, admin portal and role checks, Basic/Pro membership routing, learning resources, progress pages, profile and Settings pages. No Supabase service-role key is added.

## Database scripts
Stage A is already complete. Do not rerun old full setup scripts. They are moved to `database/legacy-do-not-run/` for reference only.
`database/settings-notifications-only.sql` is optional and should only be used if the relevant Settings/Notifications tables are confirmed missing.

## Testing status
Static code and archive checks are performed on this working copy. No live Supabase integration test, live login test, or production deployment is claimed. Test on a preview deployment using separate Basic, active Pro, expired Pro, Super Admin and active administrator accounts before production replacement.


## Reels collapsed-header behavior (2026-11-18)
- Basic Reels displays a compact animated, clearly labeled Pro Learning promotion in the header strip while the search header is hidden. It links to the Pro Learning entry page. Reduced-motion preferences disable the animation.
- Pro Reels removes the hidden header's reserved 58px layout space so the current reel expands to the full available viewport. The search header returns when the user scrolls upward.
- No database schema, RLS policy, uploaded media, membership records, or private storage settings are changed.


## Reels sound control update
- Added an accessible speaker toggle to each Basic and Pro reel.
- Reels still begin muted so mobile autoplay remains reliable.
- A viewer can tap the speaker control to unmute or mute the current reel.
- The selected sound preference is carried forward when possible; if Android blocks audible autoplay, the next reel falls back to muted playback so the feed continues.
- YouTube reels use the YouTube player API to keep autoplay muted first and apply sound after playback begins or after the viewer taps the sound control.
- Existing native video controls remain available. No database, Storage, RLS, or uploaded media changes were made.


## Short-video player refinement (2026-11-19)
- Both Basic and Pro Reels use the same playback behaviour. A Reel starts autoplay muted when it becomes the active visible slide.
- The centre Play button remains visible during muted autoplay so the student can deliberately enable sound. After audible playback begins, the centre button hides.
- Tapping the local video surface pauses and mutes it; the Play button returns. Pressing Play again resumes with sound.
- When another Reel becomes active, the previous Reel is paused and muted. The newly active Reel starts muted.
- A local-video seek bar and elapsed/total time display are included. YouTube embeds retain their native player controls for seeking and pausing.
- Playback waits are guarded so a slow-loading Reel does not begin playing after the student has already moved to another slide.
- No automatic 3-second unmute, database changes, RLS changes, Storage changes, or changes to existing uploaded media.
- Static JavaScript/archive checks only; actual Android device playback and live hosting still require user testing.


## Student profile header and spacing refinement (2026-11-19)
- Moved the “My Profile” page title into the shared-style app header beside the My Study Station brand.
- Kept one Back control and one Settings control in the header; removed repeated Settings and return-to-learning buttons from the page body.
- Preserved the Basic and Pro color themes and added more consistent spacing between the header, identity card, summary cards and information panels.
- The header adapts to narrow Android screens without placing a second page title above the profile content.
- No Supabase schema, RLS, Storage, authentication or student records were changed.
