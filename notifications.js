(() => {
  'use strict';
  const $=id=>document.getElementById(id);let user=null,rows=[],filter='all',preferences={allow_announcements:true,allow_learning:true,allow_membership:true};
  const setStatus=(s,type='')=>{const el=$('notification-status');if(el){el.textContent=s;el.className='status '+type;}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString();};
  const permitted=n=>{if(n.category==='account')return true;if(n.category==='announcement')return preferences.allow_announcements!==false;if(n.category==='learning'||n.category==='achievement')return preferences.allow_learning!==false;if(n.category==='membership')return preferences.allow_membership!==false;return true;};
  async function load(){
    const pref=await MSS.client().from('student_notification_preferences').select('allow_announcements,allow_learning,allow_membership').eq('user_id',user.id).maybeSingle();if(!pref.error&&pref.data)preferences=pref.data;
    const {data,error}=await MSS.client().from('student_notifications').select('id,title,body,category,read_at,created_at,link_url').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
    if(error){$('notification-list').innerHTML='<div class="empty-state">Notifications are not connected yet. Check the optional Settings/Notifications database instructions.</div>';setStatus('Notifications database tables are not available. Check the optional Settings/Notifications SQL instructions.','error');$('notification-summary').textContent='Unable to load notifications';return;}
    rows=(data||[]).filter(permitted);render();
  }
  function render(){
    const unread=rows.filter(x=>!x.read_at).length;$('notification-summary').textContent=`${rows.length} notification${rows.length===1?'':'s'} · ${unread} unread`;
    const shown=rows.filter(x=>filter==='all'||x.category===filter);const root=$('notification-list');root.replaceChildren();
    if(!shown.length){const empty=document.createElement('div');empty.className='empty-state';empty.textContent='There are no notifications in this category yet.';root.append(empty);return;}
    shown.forEach(item=>{
      const card=document.createElement('article');card.className='notice'+(!item.read_at?' unread':'');
      const head=document.createElement('div');head.className='notice-head';const content=document.createElement('div');
      const title=document.createElement('h3');title.textContent=item.title;const body=document.createElement('p');body.textContent=item.body||'';const time=document.createElement('time');time.textContent=formatDate(item.created_at);content.append(title,body,time);
      const badge=document.createElement('span');badge.className='membership-pill';badge.textContent=item.category||'update';head.append(content,badge);card.append(head);
      const actions=document.createElement('div');actions.className='notice-actions';
      if(!item.read_at){const b=document.createElement('button');b.className='btn btn-soft';b.type='button';b.textContent='Mark as read';b.addEventListener('click',()=>markRead(item.id));actions.append(b);}
      const link=MSS.safeInternalLink(item.link_url);if(link){const a=document.createElement('a');a.className='btn btn-primary';a.href=link;a.textContent='Open';actions.append(a);}
      if(actions.childElementCount)card.append(actions);root.append(card);
    });
  }
  async function markRead(id){const {error}=await MSS.client().from('student_notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id);if(error){setStatus('Could not update this notification.','error');return;}const item=rows.find(x=>x.id===id);if(item)item.read_at=new Date().toISOString();render();}
  async function markAll(){const ids=rows.filter(x=>!x.read_at).map(x=>x.id);if(!ids.length)return;const {error}=await MSS.client().from('student_notifications').update({read_at:new Date().toISOString()}).eq('user_id',user.id).is('read_at',null);if(error){setStatus('Could not mark notifications as read.','error');return;}const now=new Date().toISOString();rows.forEach(x=>{if(ids.includes(x.id))x.read_at=now;});render();setStatus('All notifications marked as read.','success');}
  document.addEventListener('DOMContentLoaded',async()=>{
    const result=await MSS.requireArea('basic');if(!result)return;user=result.user;
    document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
    $('mark-all-read').addEventListener('click',markAll);await load();
  });
})();
