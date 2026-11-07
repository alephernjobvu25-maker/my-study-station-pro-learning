/* Student work-area access gate and profile/membership display */
(async function () {
  const msg = document.getElementById("dashboard-message");
  const statusEl = document.getElementById("membership-status");

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    window.location.replace("login.html");
    return;
  }

  const { data: membership, error: membershipError } = await supabaseClient
    .from("memberships")
    .select("status,expires_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    if (msg) msg.textContent = "We could not verify your membership. Please refresh or sign in again.";
    if (statusEl) statusEl.textContent = "Unable to verify";
    return; // fail closed
  }

  const status = String(membership?.status || "").toLowerCase();
  const expiryMs = membership?.expires_at ? Date.parse(membership.expires_at) : NaN;
  const active = status === "active" && Number.isFinite(expiryMs) && expiryMs > Date.now();
  if (!active) {
    window.location.replace("subscription-expired.html");
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("email,student_number,display_name,school_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError && msg) msg.textContent = "Your membership is active, but your profile could not be loaded.";

  document.getElementById("student-name").textContent =
    profile?.display_name || user.user_metadata?.display_name || "Learner";
  document.getElementById("student-number").textContent =
    profile?.student_number || "Pending confirmation";

  if (profile?.school_id) {
    const { data: school } = await supabaseClient
      .from("schools")
      .select("school_name")
      .eq("id", profile.school_id)
      .maybeSingle();
    document.getElementById("school-name").textContent = school?.school_name || "Selected school";
  }

  if (statusEl) {
    statusEl.textContent = membership?.expires_at
      ? "Active until " + new Date(membership.expires_at).toLocaleDateString()
      : "Active";
  }

  const logoutButton = document.getElementById("logout");
  if (logoutButton) logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.replace("login.html");
  });
})();
