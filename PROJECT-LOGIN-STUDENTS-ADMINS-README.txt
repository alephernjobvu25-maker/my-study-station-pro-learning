MY STUDY STATION PRO LEARNING — COMPLETE SOURCE PACKAGE

WHAT THIS ZIP CONTAINS
This is a consolidated website source package based on the latest complete student/public-profile website snapshot available in the project files (19 November 2026), with the Stage 1 Super Administrator dashboard and the permanent-owner Account Security page integrated.

STUDENT ACCESS
- index.html: public landing page.
- register.html: student account creation through Supabase Auth.
- login.html + auth.js: student sign-in, email-confirmation handling, password reset request, and Basic/Pro routing based on the latest membership record.
- basic.html / pro.html and their learning pages: student learning areas, profile, settings, notes, papers, quizzes, timetable, progress, notifications, chat placeholder, and Reels pages.
- app-core.js / pro-page-guard.js: shared student, profile, and membership helpers.

ADMIN ACCESS
- admin-login.html: separate administrator sign-in. It checks is_super_admin() first, then is_platform_admin(), and rejects accounts without an active admin role.
- admin.html + admin.js: general administrator portal and database permission gate.
- admin-management.html: administrator management page (only the Super Admin should use appointment/removal functions; database RLS remains authoritative).
- reels-moderation.html / video-moderation.html: moderation interfaces included in this source snapshot.
- super-admin.html + super-admin.js + super-admin.css: Super Admin dashboard, database-backed summary counts, responsive navigation and theme controls.
- super-admin-section.html + super-admin-section.js: dedicated Super Admin section shell. Several section areas remain planned placeholders, as described on those pages.
- super-admin-security.html: owner-only password page. It verifies the known owner account and is_super_admin() and requires the current password before changing it.

IMPORTANT SECURITY AND DATA NOTES
1. Keep the existing Supabase project and its data. This package is website source code; it does not export or replace Auth users, student profiles, memberships, uploaded files, Reels media, Storage buckets, database rows, or RLS policies.
2. Keep supabase.js and its public publishable key as supplied in this package. Never put a Supabase service-role/secret key in browser files.
3. Do not rerun old SQL/setup scripts just because they are present in the project. In particular, the profile SQL files are included as source/reference files; only apply a migration after checking the live schema and confirming it has not already been applied. The permanent Super Admin protection migration is not part of this website ZIP and should not be rerun.
4. The package does not make every admin feature complete. The Super Admin dashboard and role checks are present; the section shell explicitly marks several functions as planned until the corresponding database tables and permissions are verified. The general admin portal currently focuses on moderation. Do not assume school/community scoping or full admin-management workflows have been live-tested from this package.
5. The student notes and some progress data may use browser-local storage as described in IMPLEMENTATION-NOTES.md; do not assume every learning item syncs across devices.

DEPLOYMENT
- Make a backup of the current Cloudflare website files first.
- Extract this ZIP and deploy its website files to the root of the active Cloudflare Pages/site project.
- Do not deploy to the old/stale Netlify site.
- Keep the same Supabase project URL and publishable key. Do not replace your live database.
- Preview and test before making it the production version.

TEST CHECKLIST
A. Student registration: create a test student, confirm email, then sign in.
B. Basic student: sign in with an account without active Pro membership and verify Basic routing.
C. Pro student: sign in with an account whose latest membership is active and not expired; verify Pro routing.
D. Expired/no membership: verify Basic routing and that Pro pages are guarded.
E. Admin: sign in using an active non-owner admin account and verify only its permitted admin portal functions are available.
F. Super Admin: sign in with the permanent owner account; verify dashboard and Account Security. Do not test by attempting to delete or demote the permanent owner.
G. Password page: verify access is blocked for non-owner accounts; only change the owner password when the current password is known and the account owner intends to do so.
H. Reels/profile: verify existing records and media still appear; do not delete or re-upload production content as a test.

TESTING STATUS
Files were consolidated and checked for archive integrity, required files, local page links, and JavaScript syntax. This does not prove live Supabase authentication, database permissions, Android browser behavior, Cloudflare deployment, or production data access. Those require a controlled preview test.
