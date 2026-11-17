MY STUDY STATION — FIRST LEARNING UI IMPLEMENTATION

This is a separate working copy based on the project ZIP supplied in chat. Keep the original ZIP unchanged as your backup.

MAIN NEW PAGES:
- basic.html                 Basic Learning Home
- pro.html                   Pro Learning Home
- basic-notifications.html   Basic Notifications
- progress.html              Pro Progress + Notifications
- basic-reels.html           Basic Reels
- pro-reels.html             Pro Reels
- settings.html              Shared Basic/Pro Settings (appearance, privacy, notification preferences, password change)

SUPPORTING PAGES:
- profile.html               Private student profile view (read-only for now)
- chat.html                  Guarded Pro Chat placeholder
- video-moderation.html      Admin moderation for Reels, comments and reports

IMPORTANT:
1. Read IMPLEMENTATION-NOTES.md before installing.
2. Review mss-learning-setup.sql. It assumes the existing memberships table and is_platform_admin() function.
3. Run mss-learning-setup.sql in Supabase only after reviewing it.
4. Do NOT run supabase-video-learning.sql. It is deprecated and replaced by mss-learning-setup.sql.
5. The Supabase SQL has not been executed and this package has not been deployed or tested against the live project.
6. Never add a Supabase service-role or secret key to browser code.
7. Keep the original ZIP as a backup and test with separate Basic, active Pro, expired Pro, and admin accounts before replacing the live site.

KNOWN NEXT TASKS:
- Add the Basic notes, quiz, achievement and resource modules.
- Build the real Pro Chat system with safety/moderation controls.
- Build the public profile endpoint that exposes only opted-in permitted details.
- Add profile editing and photo upload.
- Connect notification creation to the admin dashboard.
- Move progress data from browser storage into RLS-protected Supabase tables.
- Connect subscription payments and renewal workflows.
