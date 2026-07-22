(()=>{
  const init=()=>{
    const tools=document.querySelector('[data-series-tools]');const grid=document.querySelector('.story-grid');if(!tools||!grid)return;
    const status=window.KYOKAI_READING_STATUS;const savedApi=window.KYOKAI_SAVED_STORIES;const cards=[...grid.querySelectorAll('.story-card')];if(!cards.length)return;
    const query=tools.querySelector('[data-role="query"]');const filter=tools.querySelector('[data-role="filter"]');const read=tools.querySelector('[data-role="read"]');const sort=tools.querySelector('[data-role="sort"]');const nextUnread=tools.querySelector('[data-role="next-unread"]');const reset=tools.querySelector('[data-role="reset"]');const result=tools.querySelector('[data-role="result"]');
    if(!query||!filter||!read||!sort||!nextUnread||!reset||!result)return;
    let saved=tools.querySelector('[data-role="saved"]');
    if(!saved){saved=document.createElement('select');saved.dataset.role='saved';saved.className='save-status-select';saved.setAttribute('aria-label','あとで読むの保存状態で絞り込み');saved.innerHTML='<option value="">保存状態すべて</option><option value="saved">あとで読むだけ</option>';sort.before(saved);}
    const normalize=value=>String(value||'').toLocaleLowerCase('ja');const params=new URLSearchParams(location.search);
    const allowedFilters=new Set(['','quick','fear5','long']);const allowedRead=new Set(['','unread','read']);const allowedSaved=new Set(['','saved']);const allowedSorts=new Set(['public','short','long','fear']);
    query.value=params.get('q')||'';filter.value=allowedFilters.has(params.get('pick')||'')?(params.get('pick')||''):'';read.value=allowedRead.has(params.get('read')||'')?(params.get('read')||''):'';saved.value=allowedSaved.has(params.get('saved')||'')?(params.get('saved')||''):'';sort.value=allowedSorts.has(params.get('sort')||'')?(params.get('sort')||''):'public';
    const isRead=card=>Boolean(status?.isRead(card.dataset.storyId));const isSaved=card=>Boolean(savedApi?.isSaved(card.dataset.storyId));
    const syncUrl=()=>{if(!history.replaceState)return;const next=new URL(location.href);const values={q:query.value.trim(),pick:filter.value,read:read.value,saved:saved.value,sort:sort.value==='public'?'':sort.value};for(const [key,value] of Object.entries(values)){if(value)next.searchParams.set(key,value);else next.searchParams.delete(key);}history.replaceState(null,'',`${next.pathname}${next.search}${next.hash}`);};
    const matchesFilter=card=>{const minutes=Number(card.dataset.minutes||0);const fear=Number(card.dataset.fear||0);if(filter.value==='quick')return minutes<=6;if(filter.value==='fear5')return fear===5;if(filter.value==='long')return minutes>=10;return true;};
    const matchesRead=card=>!read.value||(read.value==='read'?isRead(card):!isRead(card));const matchesSaved=card=>!saved.value||(saved.value==='saved'&&isSaved(card));
    const order=list=>{const ordered=[...list];if(sort.value==='short')ordered.sort((a,b)=>Number(a.dataset.minutes)-Number(b.dataset.minutes)||Number(a.dataset.index)-Number(b.dataset.index));else if(sort.value==='long')ordered.sort((a,b)=>Number(b.dataset.minutes)-Number(a.dataset.minutes)||Number(a.dataset.index)-Number(b.dataset.index));else if(sort.value==='fear')ordered.sort((a,b)=>Number(b.dataset.fear)-Number(a.dataset.fear)||Number(a.dataset.minutes)-Number(b.dataset.minutes)||Number(a.dataset.index)-Number(b.dataset.index));else ordered.sort((a,b)=>Number(a.dataset.index)-Number(b.dataset.index));return ordered;};
    let unread=[];
    const apply=()=>{
      const term=normalize(query.value).trim();const base=cards.filter(card=>(!term||normalize(card.dataset.search).includes(term))&&matchesFilter(card));const visible=order(base.filter(card=>matchesRead(card)&&matchesSaved(card)));unread=order(base.filter(card=>!isRead(card)&&matchesSaved(card)));
      order(cards).forEach(card=>grid.appendChild(card));const set=new Set(visible);cards.forEach(card=>{card.hidden=!set.has(card);});
      const labels=[];if(term)labels.push(`「${query.value.trim()}」`);if(filter.value==='quick')labels.push('6分以内');if(filter.value==='fear5')labels.push('恐怖度5');if(filter.value==='long')labels.push('10分以上');if(read.value==='unread')labels.push('未読だけ');if(read.value==='read')labels.push('読了済みだけ');if(saved.value==='saved')labels.push('あとで読むだけ');
      result.textContent=`${visible.length}話を表示中（全${cards.length}話）${labels.length?`・条件: ${labels.join(' / ')}`:''}`;nextUnread.disabled=!unread.length;nextUnread.textContent=unread.length?`次の未読作品（${unread.length}話）`:'条件内はすべて読了済み';syncUrl();
    };
    query.addEventListener('input',apply);filter.addEventListener('change',apply);read.addEventListener('change',apply);saved.addEventListener('change',apply);sort.addEventListener('change',apply);nextUnread.addEventListener('click',()=>{const card=unread[0];if(card)location.href=card.href;});reset.addEventListener('click',()=>{query.value='';filter.value='';read.value='';saved.value='';sort.value='public';apply();query.focus();});
    document.addEventListener('kyokai-reading-status-change',apply);document.addEventListener('kyokai-saved-stories-change',apply);tools.hidden=false;apply();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();