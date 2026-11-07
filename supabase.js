/* My Study Station Pro Learning — Supabase client setup.
   Uses the browser-safe publishable key. Never put a Supabase secret/service-role key here. */

(function () {
  const SUPABASE_URL = "https://oedgmybbbhbqerxbmeek.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TlOH5MnKEdgS1b3fi3NqVg_4MW08jEE";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase JS library did not load. Check the CDN script tag before supabase.js.");
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  // Expose a classic-script global name used by the site's auth.js/dashboard.js.
  var supabaseClient = window.supabaseClient;
  window.supabaseClientReady = true;
})();
