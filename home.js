(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const area = document.body.dataset.area || 'pro';
  const status = (message, type='') => { const el=$('home-status') || $('basic-message'); if(el){el.textContent=message;el.className='status '+type;} };

  async function loadOwnProfileAvatar(userId, displayName){
    const avatar=$('student-avatar');
    if(!avatar || !userId || !window.MSS?.client())return;
    const initial=(String(displayName||'Learner').trim()[0]||'L').toUpperCase();
    avatar.textContent=initial;
    try{
      const bucket=MSS.client().storage.from('student-profile-photos');
      const {data,error}=await bucket.list(userId,{limit:20});
      if(error)throw error;
      const file=(data||[]).find(item=>/^profile-avatar\.(jpg|png|webp)$/i.test(item.name));
      if(!file)return;
      const {data:signed,error:signedError}=await bucket.createSignedUrl(`${userId}/${file.name}`,3600);
      if(signedError||!signed?.signedUrl)return;
      const img=document.createElement('img');img.src=signed.signedUrl;img.alt='';img.loading='eager';
      img.onerror=()=>{avatar.textContent=initial;avatar.classList.remove('has-profile-photo');};
      avatar.replaceChildren(img);avatar.classList.add('has-profile-photo');
    }catch(error){console.warn('Dashboard profile photo could not be loaded:',error.message);}
  }
  async function loadFeaturedReels(){
    const root=$('home-featured-reels');
    if(!root || !window.MSS || !MSS.client())return;
    const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
    try{
      const {data,error}=await MSS.client().from('student_reels')
        .select('id,title,subject,source_type,youtube_id,storage_path,mime_type,access_tier,created_at')
        .eq('moderation_status','approved').order('created_at',{ascending:false}).limit(3);
      if(error)throw error;
      root.replaceChildren();
      if(!data?.length){root.append(make('div','home-reel-empty','New featured learning videos will appear here after they are approved.'));return;}
      for(const reel of data){
        const link=make('a','home-reel-card');
        link.href=area==='pro'?'pro-reels.html':'basic-reels.html';
        link.setAttribute('aria-label',`Open Learning Reels: ${reel.title||'Featured video'}`);
        const thumb=make('div','home-reel-thumb');
        if(reel.source_type==='youtube' && reel.youtube_id){
          const img=make('img');img.src=`https://img.youtube.com/vi/${encodeURIComponent(reel.youtube_id)}/hqdefault.jpg`;img.alt='';img.loading='lazy';
          img.onerror=()=>{img.remove();};thumb.append(img);
        }else if(reel.source_type==='upload' && reel.storage_path){
          try{
            const {data: signed,error: signedError}=await MSS.client().storage.from('student-reels').createSignedUrl(reel.storage_path,900);
            if(!signedError && signed?.signedUrl){const video=make('video');video.src=signed.signedUrl;video.muted=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');thumb.append(video);}
          }catch(_){/* Keep the branded play tile when a private preview is unavailable. */}
        }
        thumb.append(make('span','home-reel-play','▶'));
        const info=make('div','home-reel-info');
        info.append(make('strong','',reel.title||'Learning video'));
        info.append(make('small','',`${reel.subject||'General'} · ${reel.access_tier==='pro'?'Pro':'Basic'} Reel`));
        link.append(thumb,info);root.append(link);
      }
    }catch(error){
      root.replaceChildren(make('div','home-reel-empty','Featured videos are temporarily unavailable. You can still explore all Learning Reels.'));
    }
  }
  function renderHomeProgress(userId){
    if(area!=='pro')return;
    const read=(key)=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch(_){return[];}};
    const quizzes=read(`mss_progress_quizzes_${userId}_v2`);
    const sessions=read(`mss_progress_sessions_${userId}_v2`);
    const average=quizzes.length?Math.round(quizzes.reduce((sum,q)=>sum+(Number(q.total)>0?100*Number(q.score)/Number(q.total):0),0)/quizzes.length):0;
    if($('home-quiz-count'))$('home-quiz-count').textContent=String(quizzes.length);
    if($('home-average-score'))$('home-average-score').textContent=average+'%';
    if($('home-study-count'))$('home-study-count').textContent=String(sessions.length);
    if($('home-average-fill'))$('home-average-fill').style.width=Math.max(0,Math.min(100,average))+'%';
  }
  async function init(){
    if(!window.MSS || !window.supabaseClient){status('The learning system could not connect. Please refresh and try again.','error');return;}
    try{
      const result=await MSS.requireArea(area);if(!result)return;
      if(area==='pro' && (!result.membership || !result.membership.active) && !result.privileged) {status(result.error?.message || 'We could not verify your Pro membership. Please try again.','error');return;}
      const name=MSS.displayName(result.profile,result.user);
      renderHomeProgress(result.user.id);
      if($('student-name')) $('student-name').textContent=name;
      if($('student-avatar')) $('student-avatar').textContent=(name.trim()[0]||'L').toUpperCase();
      await loadOwnProfileAvatar(result.user.id,name);
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
      if(area==='pro' && result.membership?.expiresAt && !result.privileged){const expiry=Date.parse(result.membership.expiresAt);setInterval(()=>{const left=expiry-Date.now();if(left<=0){window.location.replace('basic.html');return;}const days=Math.max(0,Math.ceil(left/86400000));$('membership-days').textContent=String(days);},60000);}
      await loadFeaturedReels();
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
