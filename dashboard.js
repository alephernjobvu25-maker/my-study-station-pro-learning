/* File: dashboard.js — authenticated student profile summary */
(async function () {
  const msg = document.getElementById("dashboard-message");
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) { window.location.replace("login.html"); return; }
  const { data: profile, error } = await supabaseClient.from("profiles")
    .select("email,student_number,display_name,school_id").eq("id", user.id).maybeSingle();
  if (error) { msg.textContent = "Could not load profile: " + error.message; return; }
  document.getElementById("student-name").textContent = profile?.display_name || user.user_metadata?.display_name || "Learner";
  document.getElementById("student-number").textContent = profile?.student_number || "Pending confirmation";
  if (profile?.school_id) {
    const { data: school } = await supabaseClient.from("schools").select("school_name").eq("id", profile.school_id).maybeSingle();
    document.getElementById("school-name").textContent = school?.school_name || "Selected school";
  }
  const { data: membership } = await supabaseClient.from("memberships").select("status,expires_at").eq("user_id", user.id).order("created_at", {ascending:false}).limit(1).maybeSingle();
  document.getElementById("membership-status").textContent = membership?.status || "Not active";
  document.getElementById("logout").addEventListener("click", async () => {
    await supabaseClient.auth.signOut(); window.location.replace("login.html");
  });
})();
