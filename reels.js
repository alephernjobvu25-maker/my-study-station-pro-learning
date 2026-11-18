/* Student Reels for My Study Station — uses the completed Stage A schema.
   Feed visibility and upload permissions are enforced by Supabase RLS. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const BUCKET = 'student-reels';
  const MAX_BYTES = 100 * 1024 * 1024;
  const ALLOWED_MIME = new Set(['video/mp4','video/webm','video/ogg','video/quicktime']);
  const area = document.body.dataset.area === 'pro' ? 'pro' : 'basic';
  let user = null, profile = null, isActivePro = false, privileged = false, reels = [];
  let youtubePlayers = [], renderedRows = [];
  // Every Reel starts muted. Sound is enabled only by a deliberate Play tap on that Reel.
  let activeCard = null;
  let feedObserver = null;
  let youtubeApiPromise = null;
  const say = (id, message, type='') => {
    const el=$(id); if(el){el.textContent=message;el.className='status '+type;}
  };
  const formatDate = value => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };
  function youtubeId(raw) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase().replace(/^www\./,'');
      let id = '';
      if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
      else if (['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host)) {
        if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
        else {
          const parts=url.pathname.split('/').filter(Boolean);
          if (['embed','shorts','live'].includes(parts[0])) id=parts[1] || '';
        }
      }
      return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
    } catch (_) { return null; }
  }
  function node(tag, className, text) {
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  async function mediaUrl(reel) {
    if(reel.source_type==='youtube')
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(reel.youtube_id)}?rel=0&enablejsapi=1&playsinline=1&mute=1&origin=${encodeURIComponent(location.origin)}`;
    const {data,error}=await MSS.client().storage.from(BUCKET).createSignedUrl(reel.storage_path,1800);
    if(error)throw error;
    return data.signedUrl;
  }
  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;
    youtubeApiPromise = new Promise(resolve => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === 'function') previous();
        resolve(window.YT);
      };
      if (!document.querySelector('script[data-mss-youtube-api]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.mssYoutubeApi = 'true';
        document.head.append(script);
      }
      window.setTimeout(() => resolve(window.YT || null), 12000);
    });
    return youtubeApiPromise;
  }
  async function connectYouTubePlayers() {
    const YT = await loadYouTubeApi();
    if (!YT || !YT.Player) return;
    const frames = [...($('reel-feed')?.querySelectorAll('iframe') || [])];
    frames.forEach(frame => {
      const index = [...$('reel-feed').children].indexOf(frame.closest('.reels-video-slide'));
      if (index < 0) return;
      const player = new YT.Player(frame, {
        events: {
          onReady: event => {
            try { event.target.mute(); } catch (_) {}
            const card=frame.closest('.reels-video-slide');
            updateVolumeButton(card, true);
            updateCenterButton(card, false);
            if(card===activeCard){try{event.target.mute();event.target.playVideo();updateCenterButton(card,true);}catch(_){}}
          },
          onStateChange: event => {
            const card=frame.closest('.reels-video-slide');
            if (event.data === YT.PlayerState.PLAYING) updateCenterButton(card, true);
            if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) updateCenterButton(card, false);
            if (event.data === YT.PlayerState.ENDED) advanceToNext(index);
          }
        }
      });
      youtubePlayers.push({ frame, player });
    });
  }
  async function buildCard(reel, index) {
    const card=node('article','reel-card reels-video-slide');
    const player=node('div','reel-player');
    try {
      const url=await mediaUrl(reel);
      if(reel.source_type==='youtube'){
        const frame=node('iframe');
        frame.src=url; frame.title=reel.title; frame.loading=index===0?'eager':'lazy';
        frame.referrerPolicy='strict-origin-when-cross-origin';
        frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        frame.allowFullscreen=true; player.append(frame);
      } else {
        const video=node('video');
        video.controls=false; video.playsInline=true; video.setAttribute('playsinline','');
        video.preload=index===0?'auto':'metadata';
        video.muted=true; video.defaultMuted=true; video.setAttribute('muted','');
        video.addEventListener('play',()=>updateCenterButton(card,true));
        video.addEventListener('pause',()=>updateCenterButton(card,false));
        video.addEventListener('ended', () => advanceToNext(index));
        const source=node('source'); source.src=url; source.type=reel.mime_type||'video/mp4';
        video.append(source); player.append(video);
      }
    } catch (_) {
      player.append(node('p','muted','This video is temporarily unavailable.'));
    }
    const body=node('div','reel-body');
    const creator=node('div','reel-creator');
    const avatar=node('span','reel-creator-avatar',reel.user_id===user?.id ? (MSS.displayName(profile,user).trim()[0]||'L').toUpperCase() : 'L');
    avatar.setAttribute('aria-hidden','true');
    const creatorName=node('span','reel-creator-name',reel.user_id===user?.id ? MSS.displayName(profile,user) : 'Student creator');
    creator.append(avatar,creatorName);
    body.append(creator,node('h3','',reel.title));
    body.append(node('p','reel-meta',`${reel.subject||'General'} · ${reel.topic||'General topic'} · ${reel.access_tier==='pro'?'Pro':'Basic'} · ${formatDate(reel.created_at)}`));
    if(reel.description)body.append(node('p','muted',reel.description));
    body.append(node('p','helper','Approved educational content'));
    const rail=node('aside','reel-action-rail');
    const action=(symbol,label)=>{const wrap=node('div','reel-action');const mark=node('span','reel-action-symbol',symbol);mark.setAttribute('aria-hidden','true');const caption=node('span','reel-action-label',label);wrap.append(mark,caption);return wrap;};
    const volumeAction=node('div','reel-action');
    const volumeButton=node('button','reel-action-symbol reel-volume-toggle','🔇');
    volumeButton.type='button';
    volumeButton.setAttribute('aria-label','Turn video sound on');
    volumeButton.title='Turn video sound on';
    volumeButton.setAttribute('aria-pressed','false');
    volumeButton.addEventListener('click',()=>void toggleReelSound(card));
    const volumeCaption=node('span','reel-action-label','Sound');
    volumeAction.append(volumeButton,volumeCaption);
    rail.append(volumeAction,action('♡','Like'),action('▢','Comment'),action('↗','Share'));
    const upload=node('a','reel-upload-fab','＋');upload.href=area+'-reels-upload.html';upload.setAttribute('aria-label','Upload a learning video');upload.title='Upload a learning video';rail.append(upload);
    const centerButton=node('button','reel-center-control','▶');
    centerButton.type='button';
    centerButton.setAttribute('aria-label','Play video with sound');
    centerButton.addEventListener('click',()=>void toggleCenterPlayback(card));
    player.append(centerButton);
    card.append(player,body,rail);
    return card;
  }
  async function loadFeed() {
    const {data,error}=await MSS.client().from('student_reels')
      .select('id,user_id,title,description,subject,topic,source_type,youtube_id,storage_path,mime_type,access_tier,created_at')
      .eq('moderation_status','approved').order('created_at',{ascending:false}).limit(60);
    if(error)throw error;
    reels=data||[];
    await renderFeedAsync();
    say('reel-status',`${reels.length} approved learning video${reels.length===1?'':'s'} available.`);
  }
  function updateVolumeButton(card, muted) {
    const button=card?.querySelector('.reel-volume-toggle');
    if(!button)return;
    button.textContent=muted?'🔇':'🔊';
    button.setAttribute('aria-label',muted?'Turn video sound on':'Mute video');
    button.title=muted?'Turn video sound on':'Mute video';
    button.setAttribute('aria-pressed',String(!muted));
  }
  function updateCenterButton(card, playing) {
    const button=card?.querySelector('.reel-center-control');
    if(!button)return;
    const video=card?.querySelector('video');
    const player=playerFor(card);
    const muted=video?video.muted:(player&&typeof player.isMuted==='function'?player.isMuted():true);
    const audiblePlaying=!!playing&&!muted;
    button.textContent=audiblePlaying?'Ⅱ':'▶';
    button.setAttribute('aria-label',audiblePlaying?'Pause video':'Play video with sound');
    button.title=audiblePlaying?'Pause video':'Play video with sound';
    button.classList.toggle('is-playing',audiblePlaying);
  }
  function playerFor(card) {
    const frame=card?.querySelector('iframe');
    return frame?youtubePlayers.find(item=>item.frame===frame)?.player:null;
  }
  function pauseAndMuteOtherCards(keepCard) {
    document.querySelectorAll('.reels-video-slide').forEach(card=>{
      if(card===keepCard)return;
      const video=card.querySelector('video');
      if(video){video.pause();video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');updateVolumeButton(card,true);}
      const player=playerFor(card);
      if(player){try{player.mute();player.pauseVideo();}catch(_){}}
      updateCenterButton(card,false);
    });
  }
  async function toggleCenterPlayback(card) {
    const video=card?.querySelector('video');
    const player=playerFor(card);
    if(video){
      if(!video.paused&&!video.muted){video.pause();video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');updateVolumeButton(card,true);updateCenterButton(card,false);return;}
      pauseAndMuteOtherCards(card); activeCard=card;
      video.volume=1;video.muted=false;video.defaultMuted=false;video.removeAttribute('muted');
      try{await video.play();updateVolumeButton(card,false);updateCenterButton(card,true);}
      catch(_){video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');try{await video.play();}catch(__){}updateVolumeButton(card,true);updateCenterButton(card,!video.paused);}
      return;
    }
    if(player){
      try{
        const state=player.getPlayerState();
        if(state===1&&!player.isMuted()){player.pauseVideo();player.mute();updateVolumeButton(card,true);updateCenterButton(card,false);return;}
        pauseAndMuteOtherCards(card);activeCard=card;player.unMute();player.setVolume(100);player.playVideo();updateVolumeButton(card,false);updateCenterButton(card,true);
      }catch(_){}
    }
  }
  async function toggleReelSound(card) {
    const video=card?.querySelector('video');
    const player=playerFor(card);
    if(video){
      const nextMuted=!video.muted;
      if(!nextMuted){pauseAndMuteOtherCards(card);activeCard=card;video.volume=1;}
      video.muted=nextMuted;video.defaultMuted=nextMuted;
      if(nextMuted)video.setAttribute('muted','');else video.removeAttribute('muted');
      if(!nextMuted&&video.paused){try{await video.play();}catch(_){video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');}}
      updateVolumeButton(card,video.muted);return;
    }
    if(player){
      try{if(player.isMuted()) {pauseAndMuteOtherCards(card);activeCard=card;player.unMute();player.setVolume(100);player.playVideo();updateVolumeButton(card,false);} else {player.mute();updateVolumeButton(card,true);}}catch(_){}
    }
  }
  function showTapToPlay(card, video) {
    if (!card || card.querySelector('.reel-play-fallback')) return;
    const button=node('button','reel-play-fallback','▶  Tap to play');
    button.type='button';
    button.addEventListener('click', async () => {
      pauseAndMuteOtherCards(card);activeCard=card;
      video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');
      try { await video.play(); button.remove(); updateVolumeButton(card,true); updateCenterButton(card,true); }
      catch (_) { button.textContent='Tap again to play'; }
    });
    card.append(button);
  }
  async function startVideo(card, video) {
    if (!card || !video) return false;
    pauseAndMuteOtherCards(card);activeCard=card;
    video.volume=1;video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');
    video.setAttribute('playsinline','');video.playsInline=true;
    updateVolumeButton(card,true);
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise(resolve => {
        let settled=false;
        const finish=()=>{if(settled)return;settled=true;video.removeEventListener('canplay',finish);video.removeEventListener('error',finish);resolve();};
        video.addEventListener('canplay',finish,{once:true});video.addEventListener('error',finish,{once:true});
        window.setTimeout(finish,5000);try { video.load(); } catch (_) { finish(); }
      });
    }
    try {
      const result=video.play();if(result&&typeof result.then==='function')await result;
      const fallback=card.querySelector('.reel-play-fallback');if(fallback)fallback.remove();
      updateVolumeButton(card,true);updateCenterButton(card,true);return true;
    } catch (_) {
      updateCenterButton(card,false);showTapToPlay(card,video);return false;
    }
  }
  function advanceToNext(index) {
    const root=$('reel-feed');
    const next=root?.children[index+1];
    if(!next||!next.classList.contains('reels-video-slide')){
      say('reel-status','You have reached the end of the available learning videos.');return;
    }
    pauseAndMuteOtherCards(null);
    next.scrollIntoView({behavior:'smooth',block:'start'});
    window.setTimeout(async()=>{
      const video=next.querySelector('video');
      if(video)await startVideo(next,video);
      const player=playerFor(next);
      if(player){try{pauseAndMuteOtherCards(next);activeCard=next;player.mute();player.playVideo();updateVolumeButton(next,true);}catch(_){}}
    },350);
  }
  async function renderFeedAsync() {
    const root=$('reel-feed'); if(!root)return;
    youtubePlayers.forEach(item => { try { item.player.destroy(); } catch (_) {} });
    youtubePlayers = [];
    activeCard = null;
    root.replaceChildren();
    const search=$('reel-search');
    const subjectFilter=$('reel-subject');
    const query=search?.value.trim().toLowerCase()||'';
    const subject=subjectFilter?.value||'';
    const rows=reels.filter(r=>(!subject||r.subject===subject)&&
      (!query||`${r.title} ${r.description||''} ${r.topic||''} ${r.subject||''}`.toLowerCase().includes(query)));
    if(!rows.length){root.append(node('div','empty-state','No approved videos match your search yet. New submissions appear after moderator approval.'));return;}
    renderedRows = rows;
    for(let i=0;i<rows.length;i++)root.append(await buildCard(rows[i], i));
    if(feedObserver)feedObserver.disconnect();
    if('IntersectionObserver' in window){
      feedObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting||entry.intersectionRatio<0.65)return;
          const card=entry.target;
          if(card===activeCard)return;
          pauseAndMuteOtherCards(card);activeCard=card;
          const video=card.querySelector('video');
          if(video)void startVideo(card,video);
          const player=playerFor(card);
          if(player){try{player.mute();player.playVideo();updateVolumeButton(card,true);}catch(_){}}
        });
      },{threshold:[0.65]});
      root.querySelectorAll('.reels-video-slide').forEach(card=>feedObserver.observe(card));
    }else{
      const firstCard=root.querySelector('.reels-video-slide');
      const firstVideo=firstCard?.querySelector('video');
      if(firstVideo)void startVideo(firstCard,firstVideo);
    }
    void connectYouTubePlayers();
  }
  async function loadMySubmissions() {
    const root=$('my-reel-submissions'); if(!root)return;
    const {data,error}=await MSS.client().from('student_reels')
      .select('id,title,subject,topic,access_tier,moderation_status,rejection_reason,created_at')
      .eq('user_id',user.id).in('moderation_status',['pending','rejected'])
      .order('created_at',{ascending:false}).limit(30);
    root.replaceChildren();
    if(error){root.append(node('div','empty-state','Your submission status could not be loaded.'));return;}
    if(!data?.length){root.append(node('div','empty-state','You have no pending or rejected submissions.'));return;}
    data.forEach(r=>{
      const card=node('article','notice');
      const title=node('h3','',r.title);
      const meta=node('p','reel-meta',`${r.subject} · ${r.topic} · ${r.access_tier.toUpperCase()} · ${formatDate(r.created_at)}`);
      const status=node('span','membership-pill',r.moderation_status==='pending'?'Awaiting review':'Not approved');
      card.append(title,meta,status);
      if(r.rejection_reason)card.append(node('p','helper',`Moderator note: ${r.rejection_reason}`));
      root.append(card);
    });
  }
  async function submit(event) {
    event.preventDefault();
    const title=$('reel-title').value.trim();
    const subject=$('reel-upload-subject').value;
    const topic=$('reel-topic').value.trim();
    const description=$('reel-description')?.value.trim()||'';
    const youtube=$('reel-youtube').value.trim();
    const file=$('reel-file').files[0];
    const level=$('reel-level')?.value||'standard';
    const tier=area==='pro'&&level==='advanced'?'pro':'basic';
    if(!title||!subject||!topic){say('reel-upload-status','Complete the title, subject and topic.','error');return;}
    if(Boolean(youtube)===Boolean(file)){say('reel-upload-status','Choose exactly one source: a YouTube URL or a video file.','error');return;}
    if(tier==='pro'&&!isActivePro){say('reel-upload-status','An active Pro membership is required for Pro Reels.','error');return;}
    const button=$('reel-submit');button.disabled=true;button.textContent='Submitting…';
    let storagePath=null;
    try{
      const row={
        user_id:user.id,title,description,subject,topic,
        source_type:youtube?'youtube':'upload',youtube_id:null,storage_path:null,mime_type:null,
        access_tier:tier,moderation_status:'pending'
      };
      if(youtube){
        const id=youtubeId(youtube);
        if(!id)throw new Error('Enter a valid YouTube video link.');
        row.youtube_id=id;
      }else{
        if(!ALLOWED_MIME.has(file.type))throw new Error('Choose an MP4, WebM, OGG or QuickTime video file.');
        if(file.size>MAX_BYTES)throw new Error('The video file must be 100 MB or smaller.');
        const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
        const random=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():`${Date.now()}_${Math.random().toString(36).slice(2)}`;
        storagePath=`${user.id}/${random}_${safeName}`;
        const {error:uploadError}=await MSS.client().storage.from(BUCKET).upload(storagePath,file,{contentType:file.type,upsert:false});
        if(uploadError)throw uploadError;
        row.storage_path=storagePath;row.mime_type=file.type;
      }
      const {error}=await MSS.client().from('student_reels').insert(row);
      if(error)throw error;
      $('reel-upload-form').reset();
      say('reel-upload-status','Your video has been submitted for review. It will appear after approval.','success');
      await loadMySubmissions();
    }catch(error){
      if(storagePath)await MSS.client().storage.from(BUCKET).remove([storagePath]);
      say('reel-upload-status',error.message||'Your submission could not be completed.','error');
    }finally{button.disabled=false;button.textContent='Submit for review';}
  }
  async function init() {
    if(!window.MSS||!MSS.client()){say('reel-status','The learning system is not connected. Please refresh.','error');return;}
    try{
      const result=await MSS.requireArea(area);if(!result)return;
      user=result.user;profile=result.profile||null;privileged=!!result.privileged;isActivePro=!!result.membership?.active;
      if(area==='pro'&&!isActivePro&&!privileged){say('reel-status','An active Pro membership is required.','error');return;}
      if(area==='pro'&&$('reel-level')&&!isActivePro){
        $('reel-level').value='standard';
        const option=$('reel-level').querySelector('option[value="advanced"]');
        if(option)option.disabled=true;
      }
      if($('reel-search'))$('reel-search').addEventListener('input',renderFeedAsync);
      if($('reel-subject'))$('reel-subject').addEventListener('change',renderFeedAsync);
      const feed=$('reel-feed'), header=$('reels-viewer-header');
      if(feed&&header){
        let lastTop=0, scrollTick=false;
        feed.addEventListener('scroll',()=>{
          if(scrollTick)return; scrollTick=true;
          window.requestAnimationFrame(()=>{
            const top=feed.scrollTop, delta=top-lastTop;
            if(top<35 || delta < -5) {
              header.classList.remove('is-hidden');
              document.body.classList.remove('reels-header-hidden');
            } else if(delta > 5) {
              header.classList.add('is-hidden');
              document.body.classList.add('reels-header-hidden');
            }
            lastTop=top; scrollTick=false;
          });
        },{passive:true});
      }
      if($('reel-upload-form'))$('reel-upload-form').addEventListener('submit',submit);
      if($('reel-feed'))await loadFeed();
      if($('my-reel-submissions'))await loadMySubmissions();
    }catch(error){
      say('reel-status',error.message||'Could not load Learning Reels.','error');
      const root=$('reel-feed');if(root)root.replaceChildren(node('div','empty-state','Please try again later.'));
    }
  }
  document.addEventListener('DOMContentLoaded',()=>void init());
})();
