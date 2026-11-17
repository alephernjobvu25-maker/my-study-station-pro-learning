# My Study Station — First Learning UI Implementation

This package is a separate working copy based on the uploaded `my-study-station-pro-learning-main.zip`. Keep the original ZIP as your backup.

## Included in this coding pass

1. Basic Learning Home (`basic.html`)
2. Pro Learning Home (`pro.html`)
3. Basic Notifications (`basic-notifications.html`)
4. Pro Progress with integrated notifications (`progress.html`)
5. Basic Reels (`basic-reels.html`)
6. Pro Reels (`pro-reels.html`)
7. Shared Settings (`settings.html`)

Supporting files were added for authentication/membership checks, automatic device theme, navigation, profile view, Reels moderation, and the Supabase setup script.

## Important project behavior

- Student login routes active memberships to Pro and other students to Basic.
- Basic pages do not show a membership countdown.
- Pro Home and Pro Progress calculate remaining membership days from the latest `memberships` row.
- When a Pro membership expires while a Pro page is open, the page redirects to Basic.
- The Super Administrator can use the verified `is_super_admin()` RPC to preview Basic and Pro. The preview links appear only after that check succeeds.
- Basic bottom navigation: Home, Reels, Notifications, Settings.
- Pro bottom navigation: Home, Chat, Progress, Reels, Settings. Pro notifications are inside Progress; there is no separate Pro Notifications button.
- Profile pages have a back link and no bottom navigation.
- Automatic theme follows the device appearance preference. Font size, high contrast, and reduced-motion preferences are stored in this browser.
- Settings includes appearance preferences, notification preferences, private profile-visibility controls, and a Supabase Auth password-change form.
- The student profile visibility settings are private to the signed-in student. This package does not yet implement the public-profile display endpoint; do not expose the `profile_visibility` table directly to other students.
- The earlier Random Lesson Videos page has been retained and updated to use approved videos and pending uploads.
- Student video uploads and comments are pending moderation. The admin portal links to a moderation page for videos, comments, and reports.
- Basic Reels query standard content only. Pro Reels can query standard and advanced content. The SQL migration also enforces this distinction using `is_pro_member()`.

## Before using the new pages

1. Review `mss-learning-setup.sql` before running it in the Supabase SQL Editor.
2. The SQL assumes the existing `public.memberships` table has `user_id`, `status`, `expires_at`, and `created_at` columns.
3. It also assumes the existing `public.is_platform_admin()` function exists and returns `true` only for an active platform administrator. The existing project setup notes describe this function as part of the admin system.
4. The migration changes the old video workflow to moderation. Existing video records become `pending` when the new `approval_status` column is added, so they must be reviewed before they appear in feeds.
5. Do not run the old `supabase-video-learning.sql`; it is now marked deprecated because it allowed immediate publication and broad storage reads.
6. Notifications will remain empty until the admin notification-creation workflow is connected or authorized notifications are inserted through a trusted administrative process.

## Current limitations to finish in later implementation stages

- Basic notes, Basic quizzes, Basic achievements and a Basic resource library are placeholders; they are not linked to Pro-only resource pages.
- Pro Chat is a guarded placeholder. Messaging, groups, block/report and teacher moderation are not implemented yet.
- The profile page is a private read-only view. Profile-photo editing and the public-profile page are later tasks.
- The privacy switches are stored securely, but a restricted public-profile view/RPC still needs to be built before other students can see opted-in details.
- Progress quiz/session entries are stored in browser storage under the signed-in user's ID. They are separated between accounts on the same browser but are not synced across devices or stored in Supabase yet.
- There is no payment gateway or automated subscription-renewal flow in this package. The Pro call-to-action links to the existing membership information page.
- The admin moderation interface requires the SQL migration and an active admin role. It has not been tested against the live Supabase project.

## Security and deployment notes

- No Supabase service-role/secret key has been added to browser code.
- Do not weaken RLS or publish `profile_visibility`, notifications, reports, or private student data publicly.
- Do not replace the original deployed project until the migration and all account types have been tested.
- This ZIP is a code deliverable only. It has not been deployed, and the Supabase SQL has not been executed from this workspace.
