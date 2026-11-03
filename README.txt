MY STUDY STATION — PRO LEARNING
Starter website package.

FILES:
index.html       Landing page
login.html       Login form
register.html    Registration form
pro.html         Student dashboard shell
admin.html       Admin portal permission gate
style.css        Purple/gold responsive design
supabase.js      Supabase client config (replace placeholders)
auth.js          Signup/login/password reset
dashboard.js     Student profile/membership summary
admin.js         Admin role verification

IMPORTANT:
1. Replace YOUR_SUPABASE_PROJECT_URL and YOUR_SUPABASE_ANON_PUBLIC_KEY in supabase.js.
2. Do NOT use or expose the Supabase service_role key.
3. Supabase email confirmation and redirect URLs must be configured to your deployed website URL.
4. Existing profile trigger should create profiles/student numbers; registration does not manually insert profile rows.
5. Admin page checks the existing is_platform_admin RPC. The admin role must be assigned securely after account confirmation.
6. This is the first starter package; modules such as resources, past papers, quizzes, chat, groups, and timetable UI require further integration/testing against RLS policies.
