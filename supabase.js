/* My Study Station Pro Learning - Supabase browser configuration
   Uses the public publishable key. Never place a Supabase secret/service_role key here. */
const SUPABASE_URL = "https://oedgmybbbhbqerxbmeek.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TlOH5MnKEdgS1b3fi3NqVg_4MW08jEE";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("Supabase JS SDK did not load. Check the CDN script before supabase.js.");
} else {
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
}
