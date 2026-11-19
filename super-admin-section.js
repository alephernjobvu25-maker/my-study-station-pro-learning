(() => {
  const sections = {
    analytics:["Platform Analytics","Review platform growth and usage trends.","Charts will use verified historical records when their data sources are confirmed."],
    students:["Student Management","Manage student accounts and access.","Student search, account details and account actions will be developed in this dedicated page."],
    schools:["Schools & Communities","Manage the platform's school and community structure.","School registration, community creation and school-to-community assignments will be added after the existing schema is verified."],
    subscriptions:["Subscription Management","Manage Basic and Pro membership rules.","Membership records and administrator Pro entitlements will be handled separately from student subscriptions."],
    community:["Community Management","Oversee community activity and moderation.","Community reports and moderation oversight will be added here."],
    feedback:["Client Feedback","Review feedback and support requests.","Feedback inbox, status tracking and responses will be added after its data source is confirmed."],
    audit:["Audit Logs","Review important administrative actions.","This page will read existing audit records; it will not fabricate activity."],
    security:["Security Centre","Manage platform-wide security oversight.","Only the Super Administrator can access platform security controls. Database policies remain the enforcement layer."],
    settings:["Platform Settings","Configure global platform behaviour.","Platform-wide configuration will be added in controlled stages with confirmation for sensitive changes."],
    profile:["My Admin Profile","Manage the Super Administrator's own profile.","Use the Account Security link to change the permanent owner's password after confirming the current password."]
  };
  const params = new URLSearchParams(location.search);
  const key = params.get("section") || "analytics";
  const data = sections[key] || sections.analytics;
  document.title = data[0] + " | My Study Station";
  document.querySelector("#topTitle").textContent = data[0];
  document.querySelector("#sectionTitle").textContent = data[0];
  document.querySelector("#sectionDescription").textContent = data[1];
  document.querySelector("#comingTitle").textContent = data[0] + " is being built as a separate page.";
  document.querySelector("#comingDescription").textContent = data[2];
  document.querySelectorAll(".nav-link").forEach(link => {
    const url = new URL(link.href, location.href);
    if (url.searchParams.get("section") === key) link.classList.add("active");
  });
  const root = document.documentElement, body = document.body;
  root.dataset.theme = localStorage.getItem("mss-super-admin-theme") || "dark";
  const themeButton = document.querySelector("#themeButton");
  const saved = localStorage.getItem("mss-super-admin-theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  themeButton.textContent = root.dataset.theme === "dark" ? "☀" : "☾";
  themeButton.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("mss-super-admin-theme", root.dataset.theme);
    themeButton.textContent = root.dataset.theme === "dark" ? "☀" : "☾";
  });
  document.querySelector("#menuButton").addEventListener("click", () => body.classList.add("mobile-nav-open"));
  document.querySelector("#scrim").addEventListener("click", () => body.classList.remove("mobile-nav-open"));
  document.querySelector("#collapseButton").addEventListener("click", () => {
    body.classList.toggle("sidebar-collapsed");
    localStorage.setItem("mss-super-admin-sidebar-collapsed", body.classList.contains("sidebar-collapsed") ? "1" : "0");
  });
  if (localStorage.getItem("mss-super-admin-sidebar-collapsed") === "1" && matchMedia("(min-width: 761px)").matches) body.classList.add("sidebar-collapsed");
  document.querySelector("#signOutButton").addEventListener("click", async () => {
    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
    location.replace("admin-login.html");
  });
  (async () => {
    if (!window.supabaseClient) { location.replace("admin-login.html"); return; }
    const {data:{session},error:sessionError} = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) { location.replace("admin-login.html"); return; }
    const {data:allowed,error} = await window.supabaseClient.rpc("is_super_admin");
    if (error || allowed !== true) {
      await window.supabaseClient.auth.signOut();
      location.replace("admin-login.html");
    }
  })();
})();
