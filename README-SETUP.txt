MY STUDY STATION — COMPLETE WEBSITE WORKING PACKAGE

BASE
- Built from the latest ZIP you uploaded in this conversation.
- The Basic and Pro dashboard visual system follows the previously approved design references:
  * Basic Learning: bright blue, white and soft gold.
  * Pro Learning: premium navy blue and gold.
- The package is a working copy. Your live website has not been changed.

IMPORTANT DATABASE STATUS
- Stage A is already complete in your Supabase project:
  * public.student_reels
  * private Storage bucket: student-reels
  * RLS policies and is_active_pro_member()
- Do NOT rerun the old mss-learning-setup.sql or supabase-video-learning.sql. They are stored under database/legacy-do-not-run/.
- The new Basic/Pro Reels pages use student_reels and the private student-reels bucket.
- The Random Lesson Videos page is separate and reads the existing video_lessons table using its existing fields (lesson_title, lesson_description, topic_name, duration_minutes, video_provider, video_url, is_published). It does not alter or upload into video_lessons.
- database/settings-notifications-only.sql is optional. Run it only after checking that the three Settings/Notifications tables are missing.

KEY PAGES
- basic.html / pro.html: redesigned Basic and Pro dashboards.
- basic-reels.html / pro-reels.html: student Reels feeds and moderated submissions.
- reels-moderation.html: administrator review queue.
- video-learning.html: existing published Random Lesson Videos library, kept separate from student Reels.
- settings.html: shared Settings page with area-specific appearance.
- profile.html: private student profile.
- progress.html: Pro progress and notifications.
- admin.html: admin portal with link to Student Reels Moderation.

SECURITY NOTES
- Supabase publishable key remains in supabase.js. Do not add a service-role or secret key.
- RLS is the actual enforcement for Basic/Pro Reels visibility, submissions, private video files and moderation.
- The public profile display endpoint is not implemented. Do not expose profile_visibility directly to other students.
- Student-submitted Reels remain pending until an active administrator approves them.
- This package has not been deployed or tested against the live Supabase project. Test on a preview deployment first.

DEPLOYMENT
1. Keep your existing live files as a backup.
2. Extract the ZIP.
3. Upload the contents of the website folder to a preview/staging deployment (not directly to production).
4. Do not upload database/ as website files.
5. Test Basic student, active Pro student, expired Pro student, Super Admin preview, and a separate active administrator account.
6. Only replace the live website after the preview tests pass.


STUDENT PUBLIC PROFILE UPDATE
See STUDENT-PUBLIC-PROFILE-SETUP.txt. Run student-public-profile-access.sql once before testing public creator profiles.
