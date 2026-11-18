/* Administrator moderation for the completed Stage A student_reels schema. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),BUCKET='student-reels';
  const say=(message,type='')=>{const el=$('mod-status');el.textContent=message;el.className='modstatus '+type;};
  const text=(tag,value,className='')=>{const el=document.createElement(tag);if(className)el.className=className;el.textContent=String(value??'');return el;};
  async function init(){
    try{
      if(!window.supabaseClient)throw new Error('Supabase connection is unavailable.');
      const {data:{user},error:authError}=await supabaseClient.auth.getUser();
      if(authError||!user){location.replace('admin-login.html');return;}
      const {data:allowed,error}=await supabaseClient.rpc('is_platform_admin');
      if(error)throw error;
      if(allowed!==true){say('Access denied. An active administrator account is required.','error');return;}
      await load();
    }catch(error){say(error.message||'Could not verify administrator access.','error');}
  }
  async function load(){
    const root=$('pending-list');root.replaceChildren(text('div','Loading pending submissions…','modcard'));
    const {data,error}=await supabaseClient.from('student_reels')
      .select('id,user_id,title,description,subject,topic,source_type,youtube_id,storage_path,mime_type,access_tier,created_at')
      .eq('moderation_status','pending').order('created_at',{ascending:true}).limit(100);
    if(error){root.replaceChildren(text('div','Could not load submissions: '+error.message,'modcard'));say('The review queue could not be loaded.','error');return;}
    root.replaceChildren();
    if(!data?.length){root.append(text('div','No pending submissions. The review queue is clear.','modcard'));say('Administrator permission verified.');return;}
    say(`${data.length} submission${data.length===1?'':'s'} awaiting review.`);
    for(const reel of data){
      const card=text('article','','modcard');
      card.append(text('h2',reel.title));
      card.append(text('p',`${reel.subject||'General'} · ${reel.topic||'General topic'} · ${String(reel.access_tier).toUpperCase()} · ${new Date(reel.created_at).toLocaleString()}`,'modmeta'));
      if(reel.description)card.append(text('p',reel.description));
      if(reel.source_type==='youtube'){
        const a=text('a','Open YouTube submission');
        a.href=`https://www.youtube.com/watch?v=${encodeURIComponent(reel.youtube_id)}`;
        a.target='_blank';a.rel='noopener noreferrer';card.append(a);
      }else{
        try{
          const {data:signed,error:signError}=await supabaseClient.storage.from(BUCKET).createSignedUrl(reel.storage_path,900);
          if(signError)throw signError;
          const video=document.createElement('video');video.className='modvideo';video.controls=true;video.playsInline=true;video.preload='metadata';video.src=signed.signedUrl;card.append(video);
        }catch(_){card.append(text('p','Video preview unavailable. Check the private storage object.','modmeta'));}
      }
      const actions=text('div','','modactions');
      const approve=text('button','Approve','btn btn-gold');approve.type='button';
      const reject=text('button','Reject','btn btn-ghost');reject.type='button';
      const feedback=text('p','','modstatus');feedback.setAttribute('role','status');
      approve.addEventListener('click',()=>void review(reel,'approved',card,feedback,actions));
      reject.addEventListener('click',()=>void review(reel,'rejected',card,feedback,actions));
      actions.append(approve,reject);card.append(actions,feedback);root.append(card);
    }
  }
  async function review(reel,decision,card,feedback,actions){
    let reason=null;
    if(decision==='rejected'){reason=window.prompt('Optional reason for rejection:');if(reason===null)return;}
    const buttons=actions.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
    try{
      const {data:{user},error:authError}=await supabaseClient.auth.getUser();if(authError||!user)throw new Error('Your administrator session has expired.');
      const now=new Date().toISOString();
      const patch={moderation_status:decision,reviewed_by:user.id,reviewed_at:now,rejection_reason:decision==='rejected'?(reason.trim().slice(0,500)||'Not approved by moderator'):null,updated_at:now};
      const {error}=await supabaseClient.from('student_reels').update(patch).eq('id',reel.id).eq('moderation_status','pending');
      if(error)throw error;
      card.remove();
      say(`Submission ${decision}.`,'success');
      if(!$('pending-list').querySelector('.modcard'))$('pending-list').append(text('div','No pending submissions. The review queue is clear.','modcard'));
    }catch(error){feedback.textContent=error.message||'The moderation action failed.';buttons.forEach(b=>b.disabled=false);}
  }
  document.addEventListener('DOMContentLoaded',()=>void init());
})();
