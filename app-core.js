/* Shared authenticated student helpers. Membership and role checks are verified with Supabase. */
(() => {
  'use strict';
  const client = () => window.supabaseClient || null;
  const latestMembership = async (userId) => {
    const sb = client();
    if (!sb) throw new Error('The learning system could not connect. Please refresh and try again.');
    const { data, error } = await sb.from('memberships').select('status,expires_at,created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error('We could not verify your membership. Please try again.');
    const status = String(data?.status || '').toLowerCase();
    const expiryMs = data?.expires_at ? Date.parse(data.expires_at) : NaN;
    const active = status === 'active' && Number.isFinite(expiryMs) && expiryMs > Date.now();
    const remainingDays = active ? Math.max(0, Math.ceil((expiryMs - Date.now()) / 86400000)) : 0;
    return { active, status: active ? 'active' : (status || 'not_active'), expiresAt: data?.expires_at || null, remainingDays };
  };
  const currentUser = async () => {
    const sb = client();
    if (!sb) throw new Error('Supabase is not initialized. Check your connection and configuration.');
    const { data, error } = await sb.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  };
  const getProfile = async (user) => {
    const sb = client();
    const { data, error } = await sb.from('profiles').select('display_name,student_number,school_id').eq('id', user.id).maybeSingle();
    if (error) console.warn('Profile could not be loaded:', error.message);
    return data || {
      display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
      student_number: '', school_id: null
    };
  };
  const isSuperAdmin = async () => {
    const sb = client();
    if (!sb) return false;
    try {
      const { data, error } = await sb.rpc('is_super_admin');
      return !error && data === true;
    } catch (_) { return false; }
  };
  const requireArea = async (area) => {
    const user = await currentUser();
    if (!user) { window.location.replace('login.html'); return null; }
    let membership;
    try { membership = await latestMembership(user.id); }
    catch (error) { return { user, membership: null, profile: await getProfile(user), error }; }
    const privileged = await isSuperAdmin();
    if (area === 'pro' && membership.active && !privileged && membership.expiresAt) {
      const expiry = Date.parse(membership.expiresAt);
      if (Number.isFinite(expiry)) setInterval(() => { if (Date.now() >= expiry) window.location.replace('basic.html'); }, 60000);
    }
    if (!privileged && area === 'pro' && !membership.active) { window.location.replace('basic.html'); return null; }
    if (!privileged && area === 'basic' && membership.active) { window.location.replace('pro.html'); return null; }
    const profile = await getProfile(user);
    return { user, membership, profile, privileged };
  };
  const displayName = (profile, user) => profile?.display_name?.trim() || user?.user_metadata?.display_name?.trim() || 'Learner';
  const logout = async () => {
    const sb = client();
    if (sb) await sb.auth.signOut();
    window.location.replace('login.html');
  };
  const safeInternalLink = (raw) => {
    if (!raw) return null;
    try {
      const u = new URL(raw, window.location.href);
      if (u.origin !== window.location.origin || !/^https?:$/.test(u.protocol)) return null;
      return u.href;
    } catch (_) { return null; }
  };
  window.MSS = { client, latestMembership, currentUser, getProfile, requireArea, displayName, logout, safeInternalLink };
})();
