(() => {
  const KEY = "mss_past_papers_v1";
  const $ = id => document.getElementById(id);
  let papers = [];
  try { papers = JSON.parse(localStorage.getItem(KEY) || "[]"); if (!Array.isArray(papers)) papers = []; } catch { papers = []; }
  const safeUrl = value => { try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) ? u.href : null; } catch { return null; } };
  function persist(){ try { localStorage.setItem(KEY, JSON.stringify(papers)); return true; } catch { $("paper-message").textContent = "Could not save. Browser storage may be full or disabled."; return false; } }
  function render(){
    const q = $("paper-search").value.trim().toLowerCase(); const subject = $("filter-subject").value; const grade = $("filter-grade").value;
    const filtered = papers.filter(p => (!subject || p.subject===subject) && (!grade || p.grade===grade) && (!q || `${p.title} ${p.subject} ${p.grade} ${p.year} ${p.type}`.toLowerCase().includes(q)));
    const list = $("papers-list"); list.innerHTML = ""; $("papers-empty").hidden = filtered.length > 0;
    filtered.slice().sort((a,b)=>Number(b.year)-Number(a.year)).forEach(p => {
      const card = document.createElement("article"); card.className="paper-card";
      const title = document.createElement("h3"); title.textContent=p.title;
      const meta = document.createElement("p"); meta.className="paper-meta"; meta.textContent=`${p.subject} · ${p.grade} · ${p.year} · ${p.type}`;
      const actions = document.createElement("div"); actions.className="paper-actions";
      const link = document.createElement("a"); link.href=p.url; link.target="_blank"; link.rel="noopener noreferrer"; link.className="btn btn-gold"; link.textContent="Open paper";
      const remove = document.createElement("button"); remove.type="button"; remove.className="btn btn-ghost"; remove.textContent="Remove"; remove.addEventListener("click",()=>{papers=papers.filter(x=>x.id!==p.id); persist(); render();});
      actions.append(link,remove); card.append(title,meta,actions); list.append(card);
    });
  }
  $("paper-form").addEventListener("submit", e=>{e.preventDefault(); const url=safeUrl($("paper-url").value.trim()); if(!url){$("paper-message").textContent="Please enter a valid http or https URL.";return;} const year=Number($("paper-year").value); if(year<1990||year>2099){$("paper-message").textContent="Please enter a year between 1990 and 2099.";return;}
    papers.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),title:$("paper-title").value.trim(),subject:$("paper-subject").value,grade:$("paper-grade").value,year,type:$("paper-type").value,url}); if(persist()){ $("paper-message").textContent="Paper link saved on this device."; e.target.reset(); render(); }
  });
  ["paper-search","filter-subject","filter-grade"].forEach(id=>$(id).addEventListener("input",render)); render();
})();
