/* My Study Station Pro Learning — Supabase configuration */

(function () {
  const SUPABASE_URL =
    "https://oedgmybbbhbqerxbmeek.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_TlOH5MnKEdgS1b3fi3NqVg_4MW08jEE";

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error("Supabase CDN failed to load.");
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

  console.log("Supabase client initialized successfully.");
})();
