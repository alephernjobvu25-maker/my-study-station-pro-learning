/* Read-only published lesson library. Student submissions are handled separately by student_reels. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let lessons=[],featuredIndex=-1,rotateTimer=null,area='basic';
  const say=(message,type='')=>{const el=$('library-status');el.textContent=message;el.className='status '+type;};
  const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text??'');return el;};
  function youtubeId(raw){
    try{const u=new URL(raw),h=u.hostname.toLowerCase().replace(/^www\./,'');if(h==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||null;if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(h)){if(u.pathname==='/watch')return u.searchParams.get('v');const p=u.pathname.split('/').filter(Boolean);if(['embed','shorts','live'].includes(p[0]))return p[1]||null;}}catch(_){}return null;
  }
  function safeUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'?u.href:null;}catch(_){return null;}}
  function playerFor(lesson){
    const player=$('featured-player');player.replaceChildren();
    $('featured-title').textContent=lesson?.lesson_title||'No published lessons yet';
    $('featured-topic').textContent=lesson?`${lesson.topic_name||'General topic'}${lesson.duration_minutes?` · ${lesson.duration_minutes} minutes`:''}`:'Published lessons will appear here when available.';
    $('featured-description').textContent=lesson?.lesson_description||'';
    $('featured-source').textContent=lesson?`${String(lesson.video_provider||'external').toUpperCase()} lesson`:'Lesson library';
    if(!lesson){player.append(make('p','muted','No published lessons are available yet.'));return;}
    const url=safeUrl(lesson.video_url);
    if(!url){player.append(make('p','muted','This lesson does not have a valid secure video link.'));return;}
    const provider=String(lesson.video_provider||'external').toLowerCase();
    if(provider==='youtube'){
      const id=youtubeId(url);
      if(!id){player.append(make('a','btn btn-primary','Open lesson on YouTube'));const a=player.querySelector('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return;}
      const frame=make('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;frame.title=lesson.lesson_title;frame.loading='lazy';frame.allow='accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';player.append(frame);
    }else if(provider==='vimeo'){
      const match=url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
      if(match){const frame=make('iframe');frame.src=`https://player.vimeo.com/video/${match[1]}`;frame.title=lesson.lesson_title;frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;player.append(frame);}
      else{const a=make('a','btn btn-primary','Open lesson');a.href=url;a.target='_blank';a.rel='noopener noreferrer';player.append(a);}
    }else{
      const a=make('a','btn btn-primary','Open lesson');a.href=url;a.target='_blank';a.rel='noopener noreferrer';player.append(a);
    }
  }
  function renderList(){
    const root=$('video-library');root.replaceChildren();
    const q=$('lesson-search').value.trim().toLowerCase();
    const rows=lessons.filter(x=>`${x.lesson_title||''} ${x.topic_name||''} ${x.lesson_description||''}`.toLowerCase().includes(q));
    if(!rows.length){root.append(make('div','empty-state','No published lessons match your search.'));return;}
    rows.forEach(lesson=>{
      const card=make('article','lesson-card');
      card.append(make('h3','',lesson.lesson_title));
      card.append(make('p','lesson-meta',`${lesson.topic_name||'General topic'}${lesson.duration_minutes?` · ${lesson.duration_minutes} min`:''}`));
      if(lesson.lesson_description)card.append(make('p','muted',lesson.lesson_description));
      const b=make('button','btn btn-soft','Play lesson');b.type='button';b.addEventListener('click',()=>{featuredIndex=lessons.findIndex(x=>x.id===lesson.id);playerFor(lesson);window.scrollTo({top:0,behavior:'smooth'});});
      card.append(b);root.append(card);
    });
  }
  async function load(){
    const {data,error}=await MSS.client().from('video_lessons')
      .select('id,lesson_title,lesson_description,topic_name,duration_minutes,video_provider,video_url,created_at')
      .eq('is_published',true).order('created_at',{ascending:false}).limit(100);
    if(error)throw error;
    lessons=data||[];renderList();say(`${lessons.length} published lesson${lessons.length===1?'':'s'} loaded.`);
    await randomLesson();
    if(rotateTimer)clearInterval(rotateTimer);
    rotateTimer=setInterval(()=>void randomLesson(),30000);
  }
  async function randomLesson(){
    if(!lessons.length){playerFor(null);return;}
    let next=lessons.length===1?0:Math.floor(Math.random()*lessons.length);
    if(lessons.length>1&&next===featuredIndex)next=(next+1)%lessons.length;
    featuredIndex=next;playerFor(lessons[next]);
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    try{
      const user=await MSS.currentUser();if(!user){location.replace('login.html');return;}
      try{const m=await MSS.latestMembership(user.id);area=m.active?'pro':'basic';}catch(_){area='basic';}
      document.body.dataset.area=area;
      const home=area==='pro'?'pro.html':'basic.html',reels=area==='pro'?'pro-reels.html':'basic-reels.html';
      $('video-back').href=home;$('video-brand').href=home;$('video-area-label').textContent=area==='pro'?'PRO LEARNING':'BASIC LEARNING';
      $('reels-link').href=reels;$('reels-link-bottom').href=reels;
      $('lesson-search').addEventListener('input',renderList);
      await load();
    }catch(error){say(error.message||'The lesson library could not be loaded.','error');$('video-library').replaceChildren(make('div','empty-state','Please try again later.'));}
  });
})();
