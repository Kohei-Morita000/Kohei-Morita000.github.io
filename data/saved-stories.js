(()=>{
  const STORAGE_KEY='kyokai-yawa-saved-stories-v1';
  const idPattern=/^(?:(?:MKB|KRS|SKK)-\d{3}|KKS-S1E\d{2})$/;
  const safeStorage={get(){try{return localStorage.getItem(STORAGE_KEY);}catch{return null;}},set(value){try{localStorage.setItem(STORAGE_KEY,value);return true;}catch{return false;}}};
  const empty=()=>({ids:[],savedAt:{}});
  const readData=()=>{
    try{
      const parsed=JSON.parse(safeStorage.get()||'{}');
      const sourceIds=Array.isArray(parsed)?parsed:Array.isArray(parsed?.ids)?parsed.ids:[];
      const ids=[...new Set(sourceIds.map(String).filter(id=>idPattern.test(id)))];
      const savedAt={};
      for(const id of ids){const value=Number(parsed?.savedAt?.[id]||0);savedAt[id]=Number.isFinite(value)&&value>0?value:0;}
      ids.sort((a,b)=>(savedAt[b]||0)-(savedAt[a]||0)||a.localeCompare(b));
      return {ids,savedAt};
    }catch{return empty();}
  };
  const writeData=data=>safeStorage.set(JSON.stringify(data));
  const emit=(id,isSaved)=>document.dispatchEvent(new CustomEvent('kyokai-saved-stories-change',{detail:{id,isSaved,ids:readData().ids}}));
  const api={
    key:STORAGE_KEY,
    getSavedIds:()=>readData().ids,
    getSavedAt:id=>Number(readData().savedAt[String(id)]||0),
    isSaved:id=>readData().ids.includes(String(id)),
    setSaved(id,value=true){
      id=String(id||'');if(!idPattern.test(id))return false;
      const data=readData();const set=new Set(data.ids);
      if(value){set.add(id);data.savedAt[id]=Date.now();}else{set.delete(id);delete data.savedAt[id];}
      data.ids=[...set].sort((a,b)=>(data.savedAt[b]||0)-(data.savedAt[a]||0)||a.localeCompare(b));
      writeData(data);emit(id,value);return value;
    },
    toggle(id){return this.setSaved(id,!this.isSaved(id));},
    clear(){writeData(empty());emit(null,false);},
  };
  window.KYOKAI_SAVED_STORIES=api;
  const currentStoryId=()=>document.body.dataset.storyId||document.querySelector('.eyebrow')?.textContent.match(/(?:MKB|KRS|SKK)-\d{3}|KKS-S1E\d{2}/)?.[0]||'';
  const getId=element=>element?.dataset?.workId||element?.dataset?.storyId||element?.dataset?.relatedId||element?.dataset?.personalStoryId||'';
  const badgeFor=card=>{
    let badge=card.querySelector('[data-saved-badge]');
    if(badge)return badge;
    badge=document.createElement('span');badge.className='saved-story-badge';badge.dataset.savedBadge='';badge.textContent='あとで読む';
    if(card.classList.contains('work-card'))(card.querySelector('.work-card__head')||card).appendChild(badge);
    else if(card.classList.contains('story-card'))(card.querySelector('.story-card__head')||card).appendChild(badge);
    else if(card.classList.contains('related-story-card'))(card.querySelector('.related-story-kicker')||card).after(badge);
    else if(card.classList.contains('personal-story'))(card.querySelector('.personal-story-head')||card).appendChild(badge);
    return badge;
  };
  const decorateCards=()=>{
    document.querySelectorAll('.work-card[data-work-id],.story-card[data-story-id],.related-story-card[data-related-id],.personal-story[data-personal-story-id]').forEach(card=>{
      const id=getId(card);if(!id)return;const saved=api.isSaved(id);card.classList.toggle('is-saved',saved);card.dataset.savedStatus=saved?'saved':'unsaved';
      const existing=card.querySelector('[data-saved-badge]');
      if(saved){const badge=existing||badgeFor(card);badge.hidden=false;badge.setAttribute('aria-label',`${id}はあとで読むに保存済みです`);}else if(existing)existing.hidden=true;
    });
  };
  const ensureStoryButton=()=>{
    const id=currentStoryId();if(!id||document.querySelector('[data-toggle-saved]'))return;
    const actions=document.querySelector('.reading-completion-panel__actions')||document.querySelector('.story-overview__footer');if(!actions)return;
    const button=document.createElement('button');button.type='button';button.className='save-story-button';button.dataset.toggleSaved='';button.addEventListener('click',()=>api.toggle(id));
    actions.prepend(button);
  };
  const updateStoryButton=()=>{
    const id=currentStoryId();const button=document.querySelector('[data-toggle-saved]');if(!id||!button)return;const saved=api.isSaved(id);button.textContent=saved?'あとで読むから外す':'あとで読むに保存';button.setAttribute('aria-pressed',String(saved));button.setAttribute('aria-label',saved?'この作品をあとで読むから外す':'この作品をあとで読むに保存する');
  };
  const refresh=()=>{ensureStoryButton();decorateCards();updateStoryButton();};
  document.addEventListener('kyokai-saved-stories-change',refresh);
  document.addEventListener('kyokai-reading-status-change',refresh);
  addEventListener('storage',event=>{if(event.key===STORAGE_KEY)refresh();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();