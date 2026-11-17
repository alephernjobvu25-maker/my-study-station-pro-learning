/* Context-aware bottom navigation for Basic and Pro areas. */
(() => {
  if (document.getElementById('mss-floating-nav')) return;
  const file = location.pathname.split('/').pop().toLowerCase() || 'pro.html';
  const params = new URLSearchParams(location.search);
  const basicFiles = new Set(['basic.html','basic-notifications.html','basic-reels.html']);
  const area = document.body.dataset.area || params.get('area') || (basicFiles.has(file) ? 'basic' : 'pro');
  const isBasic = area === 'basic';
  const links = isBasic ? [
    {href:'basic.html',label:'Home',icon:'⌂'},
    {href:'basic-reels.html',label:'Reels',icon:'▶'},
    {href:'basic-notifications.html',label:'Notifications',icon:'♢'},
    {href:'settings.html?area=basic',label:'Settings',icon:'⚙'}
  ] : [
    {href:'pro.html',label:'Home',icon:'⌂'},
    {href:'chat.html',label:'Chat',icon:'✉'},
    {href:'progress.html',label:'Progress',icon:'▥'},
    {href:'pro-reels.html',label:'Reels',icon:'▶'},
    {href:'settings.html?area=pro',label:'Settings',icon:'⚙'}
  ];
  const nav=document.createElement('nav');nav.id='mss-floating-nav';nav.setAttribute('aria-label',isBasic?'Basic learning navigation':'Pro learning navigation');
  const style=document.createElement('style');style.textContent=`
    #mss-floating-nav{position:fixed;z-index:9999;left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));bottom:max(9px,env(safe-area-inset-bottom));width:min(720px,calc(100% - 20px));margin:auto;display:grid;grid-template-columns:repeat(${links.length},minmax(0,1fr));gap:4px;padding:7px;border:1px solid var(--line,#d9e4f3);border-radius:22px;background:color-mix(in srgb,var(--surface,#fff) 94%,transparent);box-shadow:0 10px 30px #0002;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
    #mss-floating-nav a{min-width:0;min-height:54px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px;padding:4px 2px;border-radius:15px;color:var(--muted,#62718a);text-decoration:none;font:700 10px/1.15 system-ui,sans-serif;text-align:center}
    #mss-floating-nav .mss-nav-icon{font-size:19px;line-height:1;color:var(--accent,#1768d5)}
    #mss-floating-nav a[aria-current=page]{color:var(--accent,#1768d5);background:var(--surface-2,#edf4ff);box-shadow:inset 0 0 0 1px var(--line,#d9e4f3)}
    #mss-floating-nav a:focus-visible{outline:2px solid var(--accent,#1768d5);outline-offset:2px}
    body.mss-nav-space{padding-bottom:96px!important}
    @media(max-width:360px){#mss-floating-nav{gap:1px;padding:5px}#mss-floating-nav a{font-size:9px;min-height:50px}#mss-floating-nav .mss-nav-icon{font-size:17px}}
  `;document.head.appendChild(style);
  const currentPath=location.pathname.split('/').pop().toLowerCase();
  links.forEach(item=>{const a=document.createElement('a');a.href=item.href;const target=item.href.split('?')[0];if(currentPath===target){a.setAttribute('aria-current','page');}a.setAttribute('aria-label',item.label+(currentPath===target?', current page':''));const icon=document.createElement('span');icon.className='mss-nav-icon';icon.setAttribute('aria-hidden','true');icon.textContent=item.icon;const label=document.createElement('span');label.textContent=item.label;a.append(icon,label);nav.append(a);});
  document.body.append(nav);document.body.classList.add('mss-nav-space');
})();
