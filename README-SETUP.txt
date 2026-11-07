MY STUDY STATION PRO LEARNING — STUDENT LOGIN + MEMBERSHIP GATE PATCH

Included:
- auth.js: student login checks Supabase credentials then checks latest membership. Active users route to pro.html; expired/inactive users route to subscription-expired.html.
- dashboard.js: validates session and subscription on direct dashboard entry, preventing access when the membership is inactive/expired.
- subscription-expired.html: friendly notice for inactive subscriptions.
- student-membership-read-policies.sql: read-only RLS policies so each student can select only their own membership/profile records.

ASSUMPTIONS inferred from the repository's current dashboard.js:
- memberships columns: user_id, status, expires_at, created_at
- profiles id is equal to auth.uid()
- a valid membership has status='active' and expires_at in the future
- the project UI shows K25/month

UPLOAD:
1. Extract this ZIP on your phone.
2. In GitHub, upload/replace auth.js and dashboard.js in repository root.
3. Upload subscription-expired.html into repository root.
4. Commit the changes and wait for Netlify deployment.
5. Review existing Supabase RLS policies; if these student SELECT policies are not already in place, review and run student-membership-read-policies.sql in Supabase SQL Editor.
6. Test with a student whose membership row is status active and expires_at is a future timestamp.

This patch does not create payment processing or auto-renewal. An authorized backend/admin must set/update membership records after renewal. No Supabase secret/service_role key is included.
