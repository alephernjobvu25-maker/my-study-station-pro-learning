MY STUDY STATION PRO LEARNING — SUPABASE + LOGO CONFIGURATION

Package contents:
- admin-login.html
- super-admin.html
- mystudystation-pro-learning-logo.png
- supabase.js (configured with your Project URL and public publishable key)

UPLOAD STEPS (GitHub via phone):
1. Open your repository:
   https://github.com/alephernjobvu25-maker/my-study-station-pro-learning
2. Upload all four files into the repository root (the same level as index.html).
3. If GitHub asks whether to replace existing admin-login.html, super-admin.html,
   or supabase.js, replace them with the package versions.
4. Commit the changes and wait for Netlify to deploy.
5. Open the separate administrator login page:
   https://my-studystation.netlify.app/admin-login.html
6. Refresh the page. If the logo is still cached, use the browser menu and reload,
   or open the site in a private tab.

SECURITY:
- The sb_publishable key is meant for browser use. Supabase Row Level Security (RLS)
  must remain enabled and correctly configured.
- Never put a Supabase secret key or service_role key in website files.
- Admin access is still checked using the existing is_super_admin / is_platform_admin RPCs.
- This package does not change database policies or assign administrator roles.
