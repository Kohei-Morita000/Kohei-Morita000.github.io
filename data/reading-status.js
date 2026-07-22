(()=>{
  const STORAGE_KEY='kyokai-yawa-read-stories-v1';
  const idPattern=/^(?:(?:MKB|KRS|SKK)-\d{3}|KKS-S1E\d{2})$/;
  const safeStorage={
    get(){try{return localStorage.getItem(STORAGE_KEY);}catch{return null;}},
    set(value){try{localStorage.setItem(STORAGE_KEY,value);return true;}catch{return false;}},
  };
  const readSet=()=>{
    try{
      const parsed=JSON.parse(safeStorage.get()||'[]');
      const values=Array.isArray(parsed)?parsed:Array.isArray(parsed?.ids)?parsed.ids:[];
      return new Set(values.filter(id=>idPattern.test(String(id))));
    }catch{return new Set();}
  };
  const emit=(id,isRead)=>document.dispatchEvent(new CustomEvent('kyokai-reading-status-change',{detail:{id,isRead,ids:[...readSet()]}}));
  const write=(set,id,isRead)=>{safeStorage.set(JSON.stringify([...set].sort()));emit(id,isRead);};
  const api={
    key:STORAGE_KEY,
    getReadIds:()=>[...readSet()],
    isRead:id=>readSet().has(String(id)),
    setRead(id,value=true){id=String(id||'');if(!idPattern.test(id))return false;const set=readSet();value?set.add(id):set.delete(id);write(set,id,value);return value;},
    toggle(id){return this.setRead(id,!this.isRead(id));},
    clear(){safeStorage.set('[]');emit(null,false);},
    nextUnread(works,afterId=''){const list=Array.isArray(works)?works:[];const set=readSet();const start=Math.max(0,list.findIndex(work=>work.id===afterId)+1);return [...list.slice(start),...list.slice(0,start)].find(work=>!set.has(work.id))||null;},
  };
  window.KYOKAI_READING_STATUS=api;

  const getId=element=>element?.dataset?.workId||element?.dataset?.storyId||element?.dataset?.relatedId||'';
  const getWorks=()=>Array.isArray(window.KYOKAI_WORKS)?window.KYOKAI_WORKS:[];
  const currentStoryId=()=>document.body.dataset.storyId||document.querySelector('.eyebrow')?.textContent.match(/(?:MKB|KRS|SKK)-\d{3}|KKS-S1E\d{2}/)?.[0]||'';
  const currentSeriesName=()=>document.querySelector('main .hero h1')?.textContent.trim()||'';
  const badgeFor=element=>{
    let badge=element.querySelector('[data-reading-badge]');
    if(badge)return badge;
    badge=document.createElement('span');badge.className='reading-status-badge';badge.dataset.readingBadge='';
    if(element.classList.contains('work-card'))(element.querySelector('.work-card__head')||element.firstElementChild||element).appendChild(badge);
    else if(element.classList.contains('story-card'))(element.querySelector('.story-card__head')||element).appendChild(badge);
    else if(element.classList.contains('related-story-card'))(element.querySelector('.related-story-kicker')||element).after(badge);
    return badge;
  };
  const decorateCards=()=>{
    document.querySelectorAll('.work-card[data-work-id],.story-card[data-story-id],.related-story-card[data-related-id]').forEach(card=>{
      const id=getId(card);if(!id)return;const isRead=api.isRead(id);card.classList.toggle('is-read',isRead);card.dataset.readStatus=isRead?'read':'unread';const badge=badgeFor(card);badge.textContent=isRead?'読了済み':'未読';badge.setAttribute('aria-label',`${id}は${isRead?'読了済み':'未読'}です`);
    });
  };
  const pageWorks=()=>{
    const all=getWorks();const series=currentSeriesName();
    if(document.querySelector('.story-grid')&&series)return all.filter(work=>work.series===series);
    return all;
  };
  const ensureSummary=()=>{
    const section=document.getElementById('works')||document.getElementById('stories');
    if(!section||section.querySelector('[data-reading-summary]'))return;
    const anchor=section.querySelector('.section-head,.section-heading');if(!anchor)return;
    const summary=document.createElement('section');summary.className='reading-library-summary';summary.dataset.readingSummary='';summary.setAttribute('aria-label','読了状況');
    summary.innerHTML='<div class="reading-library-summary__copy"><strong data-reading-count></strong><p data-reading-note>読了記録はこの端末のブラウザー内だけに保存されます。</p><div class="reading-library-summary__track" aria-hidden="true"><span class="reading-library-summary__bar" data-reading-bar></span></div></div><a class="reading-library-summary__next" data-next-unread href="#">次の未読作品</a>';
    anchor.after(summary);
  };
  const updateSummary=()=>{
    const summary=document.querySelector('[data-reading-summary]');if(!summary)return;
    const works=pageWorks();const read=works.filter(work=>api.isRead(work.id)).length;const total=works.length;const count=summary.querySelector('[data-reading-count]');const bar=summary.querySelector('[data-reading-bar]');const next=summary.querySelector('[data-next-unread]');
    count.textContent=`読了 ${read} / ${total}話`;
    bar.style.transform=`scaleX(${total?read/total:0})`;
    const candidate=api.nextUnread(works);
    if(candidate){next.hidden=false;next.href=`/kyokai-yawa/stories/${candidate.file}`;next.textContent=`次の未読作品：${candidate.title}`;}else{next.hidden=true;}
  };
  const ensureSeriesControls=()=>{
    const tools=document.querySelector('[data-series-tools]');if(!tools||tools.querySelector('[data-role="read"]'))return;
    const select=document.createElement('select');select.dataset.role='read';select.className='read-status-select';select.setAttribute('aria-label','読了状態で絞り込み');select.innerHTML='<option value="">未読・読了すべて</option><option value="unread">未読だけ</option><option value="read">読了済みだけ</option>';
    const sort=tools.querySelector('[data-role="sort"]');sort?.before(select);
    const next=document.createElement('button');next.type='button';next.dataset.role='next-unread';next.textContent='次の未読作品';
    const reset=tools.querySelector('[data-role="reset"]');reset?.before(next);
  };
  const ensureStoryPanel=()=>{
    const article=document.querySelector('article#story');const id=currentStoryId();if(!article||!id||document.querySelector('[data-reading-completion]'))return;
    document.body.dataset.storyId=id;
    const panel=document.createElement('section');panel.className='reading-completion-panel';panel.dataset.readingCompletion='';panel.setAttribute('aria-labelledby','reading-completion-title');
    panel.innerHTML='<div><h2 id="reading-completion-title">読了状況</h2><p data-reading-story-state aria-live="polite"></p><p class="reading-local-note">本文末尾まで読むと自動で読了になります。記録はこの端末だけに保存され、いつでも未読へ戻せます。</p></div><div class="reading-completion-panel__actions"><button type="button" data-toggle-read></button><a data-story-next-unread href="#">次の未読作品へ</a></div>';
    article.after(panel);
    panel.querySelector('[data-toggle-read]').addEventListener('click',()=>api.toggle(id));
  };
  const updateStoryPanel=()=>{
    const panel=document.querySelector('[data-reading-completion]');const id=currentStoryId();if(!panel||!id)return;
    const isRead=api.isRead(id);const button=panel.querySelector('[data-toggle-read]');panel.querySelector('[data-reading-story-state]').textContent=isRead?'この作品は読了済みです。':'この作品は未読です。';button.textContent=isRead?'未読に戻す':'読了済みにする';button.setAttribute('aria-pressed',String(isRead));
    const next=panel.querySelector('[data-story-next-unread]');const candidate=api.nextUnread(getWorks(),id);if(candidate&&candidate.id!==id){next.hidden=false;next.href=`/kyokai-yawa/stories/${candidate.file}`;next.textContent=`次の未読：${candidate.title}`;}else next.hidden=true;
  };
  const refresh=()=>{ensureSeriesControls();ensureSummary();ensureStoryPanel();decorateCards();updateSummary();updateStoryPanel();};
  document.addEventListener('kyokai-story-complete',()=>{const id=currentStoryId();if(id&&!api.isRead(id))api.setRead(id,true);});
  document.addEventListener('kyokai-reading-status-change',refresh);
  addEventListener('storage',event=>{if(event.key===STORAGE_KEY)refresh();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();