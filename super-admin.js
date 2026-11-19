/* Super Admin dashboard: authenticated, database-verified owner workspace. */
(() => {
  const $ = (selector) => document.querySelector(selector);
  const root = document.documentElement;
  const body = document.body;
  root.dataset.theme = localStorage.getItem("mss-super-admin-theme") || "dark";
  const notice = $("#dataNotice");
  let overviewChart = null;

  function setNotice(message, isError = false) {
    notice.classList.toggle("error", isError);
    notice.querySelector("span:last-child").textContent = message;
  }
  function animateNumber(element, value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      element.textContent = "Unavailable";
      return;
    }
    const duration = 650;
    const start = performance.now();
    const formatter = new Intl.NumberFormat();
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatter.format(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  async function countRows(table, filters = []) {
    let query = window.supabaseClient.from(table).select("*", { count: "exact", head: true });
    for (const [method, column, value] of filters) query = query[method](column, value);
    const { count, error } = await query;
    if (error) return { value: null, error: error.message };
    return { value: count ?? 0, error: null };
  }
  async function loadDashboard() {
    $("#refreshButton").disabled = true;
    setNotice("Loading current platform totals from Supabase…");
    const results = await Promise.all([
      countRows("profiles"),
      countRows("schools"),
      countRows("admin_roles", [["eq", "status", "active"]]),
      countRows("student_reels", [["eq", "moderation_status", "pending"]])
    ]);
    const keys = ["students", "schools", "admins", "pending"];
    let failures = [];
    results.forEach((result, index) => {
      animateNumber(document.querySelector(`[data-count="${keys[index]}"]`), result.value);
      if (result.error) failures.push(`${keys[index]}: ${result.error}`);
    });
    renderChart(results);
    if (failures.length) {
      setNotice("Some totals could not be read because of database permissions or unavailable data. Unavailable values are not estimated.", true);
      console.warn("Dashboard data query errors:", failures);
    } else {
      setNotice("Dashboard totals refreshed successfully. These are current database counts, not sample figures.");
    }
    $("#refreshButton").disabled = false;
  }
  function renderChart(results) {
    const canvas = $("#overviewChart");
    const fallback = $("#chartFallback");
    if (typeof Chart === "undefined") {
      canvas.hidden = true; fallback.hidden = false; return;
    }
    const labels = ["Students", "Schools", "Administrators", "Pending content"];
    const values = results.map(item => item.value);
    const valid = values.some(value => typeof value === "number");
    if (!valid) {
      canvas.hidden = true; fallback.hidden = false; fallback.textContent = "Chart data is unavailable. Check database access and try again."; return;
    }
    canvas.hidden = false; fallback.hidden = true;
    if (overviewChart) overviewChart.destroy();
    const styles = getComputedStyle(root);
    const textColor = styles.getPropertyValue("--muted").trim() || "#9baac4";
    const gridColor = styles.getPropertyValue("--line").trim() || "#263652";
    overviewChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Database records",
          data: values,
          backgroundColor: ["#83b8ffcc", "#a99affcc", "#f0c96bcc", "#62d9b0cc"],
          borderColor: ["#83b8ff", "#a99aff", "#f0c96b", "#62d9b0"],
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1000, easing: "easeOutQuart" },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "#101a32", padding: 11, displayColors: false } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: textColor, precision: 0, font: { size: 9 } }, grid: { color: gridColor } }
        }
      }
    });
  }
  async function verifyAndStart() {
    if (!window.supabaseClient) {
      setNotice("Supabase could not initialize. Check that supabase.js and the Supabase CDN are available.", true);
      return;
    }
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) {
      location.replace("admin-login.html");
      return;
    }
    const { data: isSuperAdmin, error: roleError } = await window.supabaseClient.rpc("is_super_admin");
    if (roleError || isSuperAdmin !== true) {
      setNotice("Access denied. This page is restricted to the active Super Administrator.", true);
      await window.supabaseClient.auth.signOut();
      setTimeout(() => location.replace("admin-login.html"), 1400);
      return;
    }
    await loadDashboard();
  }

  $("#refreshButton").addEventListener("click", loadDashboard);
  $("#signOutButton").addEventListener("click", async () => {
    await window.supabaseClient.auth.signOut();
    location.replace("admin-login.html");
  });
  $("#profileButton").addEventListener("click", () => location.href = "super-admin-section.html?section=profile");
  $("#themeButton").addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    localStorage.setItem("mss-super-admin-theme", next);
    $("#themeButton").textContent = next === "dark" ? "☀" : "☾";
    if (overviewChart) renderChartFromExisting();
  });
  function renderChartFromExisting() {
    if (!overviewChart) return;
    const values = overviewChart.data.datasets[0].data;
    const textColor = getComputedStyle(root).getPropertyValue("--muted").trim();
    const gridColor = getComputedStyle(root).getPropertyValue("--line").trim();
    overviewChart.options.scales.x.ticks.color = textColor;
    overviewChart.options.scales.y.ticks.color = textColor;
    overviewChart.options.scales.y.grid.color = gridColor;
    overviewChart.update();
  }
  $("#menuButton").addEventListener("click", () => body.classList.add("mobile-nav-open"));
  $("#scrim").addEventListener("click", () => body.classList.remove("mobile-nav-open"));
  $("#collapseButton").addEventListener("click", () => {
    body.classList.toggle("sidebar-collapsed");
    localStorage.setItem("mss-super-admin-sidebar-collapsed", body.classList.contains("sidebar-collapsed") ? "1" : "0");
  });
  document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => body.classList.remove("mobile-nav-open")));

  const savedTheme = localStorage.getItem("mss-super-admin-theme");
  if (savedTheme === "light" || savedTheme === "dark") root.dataset.theme = savedTheme;
  $("#themeButton").textContent = root.dataset.theme === "dark" ? "☀" : "☾";
  if (localStorage.getItem("mss-super-admin-sidebar-collapsed") === "1" && matchMedia("(min-width: 761px)").matches) body.classList.add("sidebar-collapsed");
  verifyAndStart().catch(error => {
    console.error(error);
    setNotice("Dashboard could not complete its security or data checks. " + (error.message || ""), true);
  });
})();
