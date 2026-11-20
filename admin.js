/* File: admin.js — database-backed admin permission gate only */
(async function () {
  const out = document.getElementById("admin-message");
  if (!window.supabaseClient) {
    if (out) out.textContent = "The secure connection could not initialize. Check your internet connection, Supabase CDN and supabase.js.";
    return;
  }
  const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
  if (authError || !user) { out.textContent = "Please log in first."; setTimeout(() => location.replace("admin-login.html"), 900); return; }
  // Supabase RPC is expected to enforce admin_roles security on the server.
  const { data, error } = await window.supabaseClient.rpc("is_platform_admin");
  if (error) { out.textContent = "Admin permission check failed. Contact the platform administrator."; return; }
  if (data !== true) { out.textContent = "Access denied. This account has not been granted administrator permissions."; return; }
  out.textContent = "Administrator permission verified.";
  const links = document.getElementById("admin-links");
  if (links) links.hidden = false;
})();
