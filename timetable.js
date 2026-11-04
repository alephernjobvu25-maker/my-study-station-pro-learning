(() => {
  const KEY = "mystudystation_timetable_v1";
  const weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const $ = id => document.getElementById(id);
  let entries = [];
  let selectedDay = "Monday";
  let editingId = null;

  try { entries = JSON.parse(localStorage.getItem(KEY) || "[]"); if (!Array.isArray(entries)) entries = []; }
  catch (_) { entries = []; }

  const persist = () => localStorage.setItem(KEY, JSON.stringify(entries));
  const sortEntries = list => list.sort((a,b) => a.start.localeCompare(b.start));

  function renderTabs() {
    $("dayTabs").innerHTML = "";
    weekdays.forEach(day => {
      const button = document.createElement("button");
      button.className = "daybtn" + (day === selectedDay ? " active" : "");
      button.textContent = day;
      button.type = "button";
      button.addEventListener("click", () => { selectedDay = day; $("day").value = day; render(); });
      $("dayTabs").appendChild(button);
    });
  }

  function renderSessions() {
    const root = $("sessions");
    root.innerHTML = "";
    const list = sortEntries(entries.filter(item => item.day === selectedDay));
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = `No sessions planned for ${selectedDay}. Add one above.`;
      root.appendChild(empty);
      return;
    }
    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "session";
      const info = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `${item.start} – ${item.end} · ${item.subject}`;
      const detail = document.createElement("small");
      detail.textContent = item.topic || "Study session";
      info.append(title, detail);
      const actions = document.createElement("div");
      actions.className = "actions";
      const edit = document.createElement("button");
      edit.className = "secondary"; edit.type = "button"; edit.textContent = "Edit";
      edit.addEventListener("click", () => beginEdit(item));
      const del = document.createElement("button");
      del.className = "secondary delete"; del.type = "button"; del.textContent = "Delete";
      del.addEventListener("click", () => {
        if (confirm("Delete this study session?")) {
          entries = entries.filter(entry => entry.id !== item.id);
          persist(); render();
        }
      });
      actions.append(edit, del);
      card.append(info, actions);
      root.appendChild(card);
    });
  }

  function render() { renderTabs(); renderSessions(); }

  function beginEdit(item) {
    editingId = item.id;
    $("subject").value = item.subject;
    $("day").value = item.day;
    $("start").value = item.start;
    $("end").value = item.end;
    $("topic").value = item.topic || "";
    selectedDay = item.day;
    $("formTitle").textContent = "Edit study session";
    $("saveBtn").textContent = "Update session";
    $("cancelEdit").hidden = false;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function resetForm() {
    editingId = null;
    $("sessionForm").reset();
    $("day").value = selectedDay;
    $("formTitle").textContent = "Add a study session";
    $("saveBtn").textContent = "Save session";
    $("cancelEdit").hidden = true;
  }

  $("sessionForm").addEventListener("submit", event => {
    event.preventDefault();
    const subject = $("subject").value;
    const day = $("day").value;
    const start = $("start").value;
    const end = $("end").value;
    const topic = $("topic").value.trim();
    if (!start || !end || start >= end) {
      alert("Please choose an end time that is later than the start time.");
      return;
    }
    const item = {id: editingId || (Date.now().toString(36) + Math.random().toString(36).slice(2,7)), subject, day, start, end, topic};
    if (editingId) entries = entries.map(entry => entry.id === editingId ? item : entry);
    else entries.push(item);
    selectedDay = day;
    persist();
    resetForm();
    render();
  });

  $("cancelEdit").addEventListener("click", () => { resetForm(); render(); });
  $("day").addEventListener("change", event => { selectedDay = event.target.value; render(); });
  render();
})();