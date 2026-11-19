(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const params=new URLSearchParams(location.search);
  const area=params.get('area')==='pro'?'pro':'basic';
  const targetId=params.get('id')||'';
  const PHOTO_BUCKET='student-profile-photos';
  document.body.dataset.area=area;
  const setStatus=(message,type='')=>{const el=$('student-public-status');el.textContent=message;el.className='status '+type;};
  const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text??'');return el;};
  const validId=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId);
  async function loadPhoto(userId){
    const storage=MSS.client().storage.from(PHOTO_BUCKET);
    const {data:files,error}=await storage.list(userId,{limit:20});if(error)throw error;
    const file=(files||[]).find(item=>/^profile-avatar\.(jpg|png|webp)$/i.test(item.name));if(!file)return null;
    const {data:signed,error:signedError}=await storage.createSignedUrl(`${userId}/${file.name}`,60);
    if(signedError)throw signedError;return signed?.signedUrl||null;
  }
  async function loadVideos(userId){
    const {data,error}=await MSS.client().from('student_reels')
      .select('id,title,description,subject,topic,source_type,youtube_id,storage_path,mime_type,access_tier,created_at')
      .eq('user_id',userId).eq('moderation_status','approved').order('created_at',{ascending:false}).limit(100);
    if(error)throw error;return data||[];
  }
  async function renderVideos(rows){
    const root=$('student-public-video-list');root.replaceChildren();
    $('student-public-count').textContent=`${rows.length} video${rows.length===1?'':'s'}`;
    if(!rows.length){root.append(node('div','empty-state','This student has not uploaded any approved learning videos yet.'));return;}
    for(const reel of rows){
      const card=node('article','student-public-video');
      const media=node('div','student-public-video-media');
      try{
        if(reel.source_type==='youtube'&&reel.youtube_id){
          const frame=node('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(reel.youtube_id)}?rel=0&controls=1&modestbranding=1&playsinline=1`;
          frame.title=reel.title||'Student learning video';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;media.append(frame);
        }else if(reel.storage_path){
          const {data:signed,error}=await MSS.client().storage.from('student-reels').createSignedUrl(reel.storage_path,1800);
          if(error)throw error;
          const video=node('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=signed.signedUrl;media.append(video);
        }else{media.append(node('span','muted','Video unavailable'));}
      }catch(_){media.append(node('span','muted','This video is temporarily unavailable.'));}
      const copy=node('div','student-public-video-copy');
      copy.append(node('h3','',reel.title||'Learning video'));
      copy.append(node('p','',`${reel.subject||'General'} · ${reel.topic||'General topic'} · ${reel.access_tier==='pro'?'Pro':'Basic'} · ${reel.created_at?new Date(reel.created_at).toLocaleDateString():''}`));
      if(reel.description)copy.append(node('p','',reel.description));
      card.append(media,copy);root.append(card);
    }
  }
  async function init(){
    $('student-profile-back').href=area==='pro'?'pro-reels.html':'basic-reels.html';
    $('student-profile-brand').href=area==='pro'?'pro.html':'basic.html';
    $('student-profile-area').textContent=area==='pro'?'PRO LEARNING':'BASIC LEARNING';
    if(!validId){setStatus('This student profile link is invalid.','error');return;}
    try{
      const viewer=await MSS.requireArea(area);if(!viewer)return;
      const {data,error}=await MSS.client().rpc('get_public_student_profiles',{target_user_ids:[targetId]});
      if(error)throw error;
      const publicProfile=(data||[]).find(row=>row.user_id===targetId);
      if(!publicProfile){setStatus('This student profile could not be found.','error');return;}
      const isOwner=viewer.user.id===targetId;
      const name=isOwner?MSS.displayName(viewer.profile,viewer.user):(publicProfile.display_name||'Student creator');
      $('student-public-name').textContent=name;
      $('student-public-initial').textContent=(name.trim()[0]||'S').toUpperCase();
      if(publicProfile.show_profile_photo===true||isOwner){
        try{const url=await loadPhoto(targetId);if(url){$('student-public-photo').src=url;$('student-public-photo').hidden=false;$('student-public-initial').hidden=true;}}
        catch(error){console.warn('Public student photo could not be loaded:',error.message);}
      }
      $('student-public-content').hidden=false;
      if(publicProfile.show_approved_uploads!==true&&!isOwner){
        $('student-public-caption').textContent='This student has chosen not to display their approved learning videos on their public profile.';
        $('student-public-video-list').replaceChildren(node('div','empty-state','This student has not made their approved videos visible on their public profile.'));
        $('student-public-count').textContent='Private';setStatus('Student profile loaded.');return;
      }
      $('student-public-caption').textContent='Only this student’s approved uploaded learning videos are shown here.';
      const videos=await loadVideos(targetId);await renderVideos(videos);
      setStatus('Student profile loaded.');
    }catch(error){console.error('Student profile could not be loaded:',error);setStatus(error.message||'We could not load this student profile. Please try again.','error');}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
