// Supabase browser client for My Study Station Pro Learning.
// This uses the project's public publishable key. Keep RLS enabled on all tables.
(function () {
  const SUPABASE_URL = 'https://oedgmybbbhbqerxbmeek.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TlOH5MnKEdgS1b3fi3NqVg_4MW08jEE';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase JS library failed to load.');
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
})();
