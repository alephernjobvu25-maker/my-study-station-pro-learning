(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const area = document.body.dataset.area || 'pro';
  const status = (message, type='') => { const el=$('home-status') || $('basic-message'); if(el){el.textContent=message;el.className='status '+type;} };
  async function init(){
    if(!window.MSS || !window.supabaseClient){status('The learning system could not connect. Please refresh and try again.','error');return;}
    try{
      const result=await MSS.requireArea(area);if(!result)return;
      if(area==='pro' && (!result.membership || !result.membership.active) && !result.privileged) {status(result.error?.message || 'We could not verify your Pro membership. Please try again.','error');return;}
      const name=MSS.displayName(result.profile,result.user);
      if($('student-name')) $('student-name').textContent=name;
      if($('student-avatar')) $('student-avatar').textContent=(name.trim()[0]||'L').toUpperCase();
      if($('student-number')) $('student-number').textContent=result.profile.student_number||'Pending confirmation';
      if($('school-name')){if(result.profile.school_id){const {data:school}=await MSS.client().from('schools').select('school_name').eq('id',result.profile.school_id).maybeSingle();$('school-name').textContent=school?.school_name||'Selected school';}else $('school-name').textContent='Not selected';}
      if(area==='pro'){
        const m=result.membership;
        if(result.privileged && !m?.active){$('membership-status').textContent='Admin preview';$('membership-days').textContent='—';$('membership-expiry').textContent='Not applicable';status('Super Administrator preview mode is active.');}else{$('membership-status').textContent='Active';$('membership-days').textContent=String(m.remainingDays);$('membership-expiry').textContent=m.expiresAt?new Date(m.expiresAt).toLocaleDateString(): 'Not available';if(m.remainingDays<=7) status(`Your Pro membership expires in ${m.remainingDays} day${m.remainingDays===1?'':'s'}. Please check your renewal arrangements.`,'');else status('Your Pro learning space is ready.');}
      } else status(result.error?.message ? 'Basic Learning is available. Some account information could not be verified.' : 'Your Basic learning space is ready.');
      const content=$('protected-content');if(content)content.hidden=false;
      const basicSwitch=$('switch-basic-preview');if(basicSwitch&&result.privileged)basicSwitch.hidden=false;
      const proSwitch=$('switch-pro-preview');if(proSwitch&&result.privileged)proSwitch.hidden=false;
      const logout=$('logout');if(logout)logout.addEventListener('click',MSS.logout);
      if(area==='pro' && m?.expiresAt && !result.privileged){const expiry=Date.parse(m.expiresAt);setInterval(()=>{const left=expiry-Date.now();if(left<=0){window.location.replace('basic.html');return;}const days=Math.max(0,Math.ceil(left/86400000));$('membership-days').textContent=String(days);},60000);}
      setupPromo();
    }catch(error){status(error.message||'Could not load your learning space.','error');}
  }
  function setupPromo(){
    const root=$('pro-promo');if(!root)return;
    const slides=[
      {k:'GROW YOUR LEARNING',t:'Explore Advanced Learning',p:'Discover advanced notes, lessons and learning resources with Pro Learning.'},
      {k:'SEE HOW FAR YOU HAVE COME',t:'Track Your Progress',p:'Explore detailed progress insights, learning milestones and study goals.'},
      {k:'LEARN TOGETHER',t:'Study with Others',p:'Connect with learning groups and discover more ways to learn together.'}
    ];
    let active=0,timer=null;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const paint=()=>{const s=slides[active];root.dataset.slide=String(active);$('promo-kicker').textContent=s.k;$('promo-title').textContent=s.t;$('promo-copy').textContent=s.p;root.querySelectorAll('[data-slide-to]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.slideTo)===active)));if(!reduced){root.classList.remove('promo-enter');void root.offsetWidth;root.classList.add('promo-enter');}};
    root.querySelectorAll('[data-slide-to]').forEach(b=>b.addEventListener('click',()=>{active=Number(b.dataset.slideTo);paint();if(timer){clearInterval(timer);timer=setInterval(next,5500);}}));
    const next=()=>{active=(active+1)%slides.length;paint();};paint();if(!reduced)timer=setInterval(next,5500);
    let startX=null;root.addEventListener('touchstart',e=>{startX=e.changedTouches[0]?.clientX??null},{passive:true});root.addEventListener('touchend',e=>{if(startX===null)return;const dx=(e.changedTouches[0]?.clientX??startX)-startX;if(Math.abs(dx)>45){active=(active+(dx<0?1:slides.length-1))%slides.length;paint();}startX=null},{passive:true});
  }
  document.addEventListener('DOMContentLoaded',init);
})();
