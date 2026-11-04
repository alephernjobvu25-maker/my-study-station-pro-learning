/* My Study Station floating bottom navigation
   Add this script before </body> on pro.html, notes.html, papers.html,
   quizzes.html, timetable.html and progress.html. */
(() => {
  if (document.getElementById("mss-floating-nav")) return;

  const links = [
    { href: "pro.html", label: "Home", icon: "⌂" },
    { href: "notes.html", label: "Notes", icon: "▤" },
    { href: "papers.html", label: "Papers", icon: "▧" },
    { href: "quizzes.html", label: "Quiz", icon: "✦" },
    { href: "timetable.html", label: "Timetable", icon: "◷" },
    { href: "progress.html", label: "Progress", icon: "▥" }
  ];

  const style = document.createElement("style");
  style.id = "mss-floating-nav-style";
  style.textContent = `
    #mss-floating-nav {
      position: fixed;
      z-index: 9999;
      left: max(12px, env(safe-area-inset-left));
      right: max(12px, env(safe-area-inset-right));
      bottom: max(12px, env(safe-area-inset-bottom));
      width: min(680px, calc(100% - 24px));
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 4px;
      padding: 8px;
      border: 1px solid rgba(232, 198, 107, .34);
      border-radius: 24px;
      background: rgba(25, 15, 43, .94);
      box-shadow: 0 12px 34px rgba(0, 0, 0, .38), 0 0 24px rgba(151, 104, 220, .12);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    #mss-floating-nav a {
      min-width: 0;
      min-height: 56px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 3px;
      padding: 5px 2px;
      border-radius: 16px;
      color: #c9bfdc;
      text-decoration: none;
      font: 600 10px/1.15 system-ui, -apple-system, Segoe UI, sans-serif;
      transition: background .18s ease, color .18s ease, transform .18s ease;
      -webkit-tap-highlight-color: transparent;
    }
    #mss-floating-nav a .mss-nav-icon {
      font-size: 20px;
      line-height: 1;
      color: #d9c8f5;
    }
    #mss-floating-nav a[aria-current="page"] {
      color: #f4d77e;
      background: linear-gradient(145deg, rgba(105, 73, 148, .52), rgba(54, 34, 82, .78));
      box-shadow: inset 0 0 0 1px rgba(232, 198, 107, .28);
    }
    #mss-floating-nav a[aria-current="page"] .mss-nav-icon { color: #f4d77e; }
    #mss-floating-nav a:focus-visible {
      outline: 2px solid #f4d77e;
      outline-offset: 2px;
    }
    #mss-floating-nav a:active { transform: scale(.96); }
    body.mss-nav-space { padding-bottom: 100px !important; }
    @media (max-width: 370px) {
      #mss-floating-nav { gap: 2px; padding: 6px; border-radius: 20px; }
      #mss-floating-nav a { font-size: 9px; min-height: 52px; }
      #mss-floating-nav a .mss-nav-icon { font-size: 18px; }
    }
  `;
  document.head.appendChild(style);

  const nav = document.createElement("nav");
  nav.id = "mss-floating-nav";
  nav.setAttribute("aria-label", "Study pages");

  const current = location.pathname.split("/").pop().toLowerCase() || "pro.html";
  links.forEach(item => {
    const a = document.createElement("a");
    a.href = item.href;
    if (current === item.href) {
      a.setAttribute("aria-current", "page");
      a.setAttribute("aria-label", item.label + ", current page");
    } else {
      a.setAttribute("aria-label", item.label);
    }
    const icon = document.createElement("span");
    icon.className = "mss-nav-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = item.icon;
    const label = document.createElement("span");
    label.textContent = item.label;
    a.append(icon, label);
    nav.appendChild(a);
  });

  document.body.appendChild(nav);
  document.body.classList.add("mss-nav-space");
})();
