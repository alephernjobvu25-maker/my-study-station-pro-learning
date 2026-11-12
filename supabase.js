/* My Study Station Pro Learning — browser Supabase client.
   Only the public publishable key belongs here. Never put a service-role/secret key in browser code. */
(function () {
  const SUPABASE_URL = "https://oedgmybbbhbqerxbmeek.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TlOH5MnKEdgS1b3fi3NqVg_4MW08jEE";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase JS v2 did not load. Check network/CDN availability.");
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})();
