(()=>{
  const init=()=>{
    const works=window.KYOKAI_WORKS||[];
    const status=window.KYOKAI_READING_STATUS;
    const grid=document.getElementById('work-grid');
    const section=document.getElementById('works');
    if(!grid||!section||!works.length)return;

    const style=document.createElement('style');
    style.textContent=`
      .archive-tools{display:grid;grid-template-columns:minmax(230px,1.4fr) repeat(4,minmax(135px,.65fr));gap:10px;margin:0 0 22px}
      .archive-tools input,.archive-tools select,.archive-tools button{min-height:44px;border:1px solid var(--line);background:#13110f;color:var(--ink);padding:0 13px;font:inherit}
      .archive-tools input::placeholder{color:var(--dim)}
      .archive-tools button{cursor:pointer;color:#f1dfbd;border-color:#5b4931}
      .archive-tools button:hover{background:#211b13}
      .archive-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px}
      .archive-actions button{min-width:150px}
      .archive-actions .archive-reset{border-color:var(--line);color:var(--muted);background:transparent}
      .archive-result{grid-column:1/-1;margin:0;color:var(--muted);font-size:.9rem}
      .work-card[hidden]{display:none}
      .series-detail-link{display:inline-flex;min-height:44px;align-items:center;margin-top:14px;padding:0 13px;border:1px solid var(--line);background:#21150f;color:#f0dfc0;text-decoration:none}
      .series-detail-link:hover{border-color:var(--gold)}
      @media(max-width:1100px){.archive-tools{grid-template-columns:repeat(3,minmax(0,1fr))}.archive-tools input{grid-column:1/-1}}
      @media(max-width:720px){.archive-tools{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){.archive-tools{grid-template-columns:1fr}.archive-tools input{grid-column:auto}.archive-actions,.archive-result{grid-column:1}.archive-actions{display:grid}.archive-actions button{width:100%}}
    `;
    document.head.appendChild(style);

    const seriesPages={
      'series-makabe':'/kyokai-yawa/series/makabe.html',
      'series-kurose':'/kyokai-yawa/series/kurose.html',
      'series-sakaki':'/kyokai-yawa/series/sakaki.html',
      'series-kansoku':'/kyokai-yawa/series/kansoku.html',
    };
    for(const [id,href] of Object.entries(seriesPages)){
      const card=document.getElementById(id);
      const head=card?.querySelector('.series-card-head');
      if(!head||head.querySelector('.series-detail-link'))continue;
      const link=document.createElement('a');
      link.className='series-detail-link';
      link.href=href;
      link.textContent='シリーズの案内と全話一覧';
      head.appendChild(link);
    }

    const tools=document.createElement('div');
    tools.className='archive-tools';
    tools.setAttribute('aria-label','作品を検索・絞り込み・並べ替え');

    const search=document.createElement('input');
    search.type='search';
    search.placeholder='作品名・題材・あらすじ・IDで検索';
    search.setAttribute('aria-label','作品検索');

    const series=document.createElement('select');
    series.setAttribute('aria-label','シリーズで絞り込み');
    const seriesOptions=['すべてのシリーズ',...Object.keys(window.KYOKAI_SERIES||{})];
    seriesOptions.forEach((name,index)=>{const option=document.createElement('option');option.value=index===0?'':name;option.textContent=name;series.appendChild(option);});

    const modes=[
      {value:'',label:'すべての読み方'},
      {value:'quick',label:'6分以内'},
      {value:'fear5',label:'恐怖度5'},
      {value:'standalone',label:'単独で読みやすい'},
      {value:'serial',label:'連作を順番に'},
      {value:'long',label:'10分以上'},
    ];
    const mode=document.createElement('select');
    mode.setAttribute('aria-label','読み方で絞り込み');
    modes.forEach(item=>{const option=document.createElement('option');option.value=item.value;option.textContent=item.label;mode.appendChild(option);});

    const readOptions=[{value:'',label:'未読・読了すべて'},{value:'unread',label:'未読だけ'},{value:'read',label:'読了済みだけ'}];
    const read=document.createElement('select');
    read.className='read-status-select';
    read.setAttribute('aria-label','読了状態で絞り込み');
    readOptions.forEach(item=>{const option=document.createElement('option');option.value=item.value;option.textContent=item.label;read.appendChild(option);});

    const sorts=[{value:'',label:'公開順'},{value:'short',label:'短い順'},{value:'long',label:'長い順'},{value:'fear',label:'恐怖度が高い順'}];
    const sort=document.createElement('select');
    sort.setAttribute('aria-label','作品の並べ替え');
    sorts.forEach(item=>{const option=document.createElement('option');option.value=item.value;option.textContent=item.label;sort.appendChild(option);});

    const actions=document.createElement('div');
    actions.className='archive-actions';
    const nextUnread=document.createElement('button');nextUnread.type='button';nextUnread.textContent='次の未読作品';
    const random=document.createElement('button');random.type='button';random.textContent='表示中からランダムに1話';
    const reset=document.createElement('button');reset.type='button';reset.className='archive-reset';reset.textContent='条件をリセット';
    actions.append(nextUnread,random,reset);

    const result=document.createElement('p');result.className='archive-result';result.setAttribute('aria-live','polite');
    tools.append(search,series,mode,read,sort,actions,result);
    grid.parentNode.insertBefore(tools,grid);

    const workById=new Map(works.map(work=>[work.id,work]));
    const entries=[...grid.querySelectorAll('.work-card')].map((card,index)=>({card,work:workById.get(card.dataset.workId)||works[index],index})).filter(entry=>entry.work);
    let visibleEntries=[...entries];
    let unreadCandidates=[...entries];
    const normalize=value=>String(value||'').toLocaleLowerCase('ja');
    const minutes=work=>Number.parseInt(String(work.mins).match(/\d+/)?.[0]||'0',10);
    const isRead=work=>Boolean(status?.isRead(work.id));
    const matchesMode=(work,value)=>{
      if(!value)return true;
      if(value==='quick')return minutes(work)<=6;
      if(value==='fear5')return Number(work.fear)===5;
      if(value==='standalone')return work.series!=='境界観測記';
      if(value==='serial')return work.series==='境界観測記';
      if(value==='long')return minutes(work)>=10;
      return true;
    };
    const matchesRead=(work,value)=>!value||(value==='read'?isRead(work):!isRead(work));
    const modeLabel=value=>modes.find(item=>item.value===value)?.label||'';
    const readLabel=value=>readOptions.find(item=>item.value===value)?.label||'';
    const orderEntries=list=>{
      const ordered=[...list];
      if(sort.value==='short')ordered.sort((a,b)=>minutes(a.work)-minutes(b.work)||a.index-b.index);
      else if(sort.value==='long')ordered.sort((a,b)=>minutes(b.work)-minutes(a.work)||a.index-b.index);
      else if(sort.value==='fear')ordered.sort((a,b)=>Number(b.work.fear)-Number(a.work.fear)||minutes(a.work)-minutes(b.work)||a.index-b.index);
      else ordered.sort((a,b)=>a.index-b.index);
      return ordered;
    };

    const params=new URLSearchParams(location.search);
    const initialMode=params.get('pick')||'';if(modes.some(item=>item.value===initialMode))mode.value=initialMode;
    const initialSeries=params.get('series')||'';if([...series.options].some(option=>option.value===initialSeries))series.value=initialSeries;
    const initialRead=params.get('read')||'';if(readOptions.some(item=>item.value===initialRead))read.value=initialRead;
    const initialSort=params.get('sort')||'';if(sorts.some(item=>item.value===initialSort))sort.value=initialSort;
    search.value=params.get('q')||'';

    const syncUrl=()=>{
      if(!history.replaceState)return;
      const next=new URL(location.href);
      const values={pick:mode.value,series:series.value,read:read.value,sort:sort.value,q:search.value.trim()};
      for(const [key,value] of Object.entries(values)){if(value)next.searchParams.set(key,value);else next.searchParams.delete(key);}
      history.replaceState(null,'',`${next.pathname}${next.search}${next.hash}`);
    };

    const apply=()=>{
      const query=normalize(search.value).trim();
      const selectedSeries=series.value;
      const baseEntries=entries.filter(({work,card})=>{
        const text=normalize(`${work.id} ${work.title} ${work.desc} ${work.series} ${card.dataset.search||''} ${card.dataset.tags||''} ${card.dataset.format||''}`);
        return (!selectedSeries||work.series===selectedSeries)&&matchesMode(work,mode.value)&&(!query||text.includes(query));
      });
      visibleEntries=orderEntries(baseEntries.filter(({work})=>matchesRead(work,read.value)));
      unreadCandidates=orderEntries(baseEntries.filter(({work})=>!isRead(work)));
      orderEntries(entries).forEach(entry=>grid.appendChild(entry.card));
      const visibleSet=new Set(visibleEntries);entries.forEach(entry=>{entry.card.hidden=!visibleSet.has(entry);});

      const labels=[];
      if(mode.value)labels.push(modeLabel(mode.value));
      if(selectedSeries)labels.push(selectedSeries);
      if(read.value)labels.push(readLabel(read.value));
      if(query)labels.push(`「${search.value.trim()}」`);
      result.textContent=`${visibleEntries.length}話を表示中（全${works.length}話）${labels.length?`・条件: ${labels.join(' / ')}`:''}`;
      nextUnread.disabled=!unreadCandidates.length;
      nextUnread.textContent=unreadCandidates.length?`次の未読作品（${unreadCandidates.length}話）`:'条件内はすべて読了済み';
      syncUrl();
    };

    search.addEventListener('input',apply);series.addEventListener('change',apply);mode.addEventListener('change',apply);read.addEventListener('change',apply);sort.addEventListener('change',apply);
    nextUnread.addEventListener('click',()=>{const entry=unreadCandidates[0];if(entry)location.href=`/kyokai-yawa/stories/${entry.work.file}`;});
    random.addEventListener('click',()=>{if(!visibleEntries.length){result.textContent='条件に合う作品がありません。';return;}const {work}=visibleEntries[Math.floor(Math.random()*visibleEntries.length)];location.href=`/kyokai-yawa/stories/${work.file}`;});
    reset.addEventListener('click',()=>{search.value='';series.value='';mode.value='';read.value='';sort.value='';apply();search.focus();});
    document.addEventListener('kyokai-reading-status-change',apply);
    apply();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();