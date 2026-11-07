# My Study Station Pro Learning — Auth Focus Package

Included: student login, student registration, Supabase browser client configuration (public publishable key only), separate administrator login, Super Admin gated workspace, admin role management files, membership-not-active page, and logo.

## Deployment
Upload these files into the same Netlify publish directory (site root), preserving filenames. The CDN script must load before `supabase.js`; the pages already do this.

## Supabase checks required
- Auth users should be able to sign up and sign in; configure email confirmation and Site URL / redirect URLs for your Netlify domain.
- `profiles`, `schools`, and `memberships` tables and their RLS policies must exist and allow a student to read their own records.
- The RPC functions `is_super_admin()` and `is_platform_admin()` must exist and return boolean values, with security and RLS enforced server-side.
- For an active student membership, `memberships.status` must be `active` and `expires_at` a future timestamp. This client-side check is only a page gate; secure resource access must also be protected by RLS.
- Student signup's `display_name` and optional `school_id` are passed into auth metadata. A database trigger/profile policy should populate `profiles` if your dashboard depends on that table.

## Important
Never place a Supabase secret/service-role key in browser files. The publishable key included in `supabase.js` is intended for browser use. Do not use this client-only gate as the only protection for privileged data.
