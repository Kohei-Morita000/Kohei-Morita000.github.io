(()=>{
  const init=()=>{
    const works=window.KYOKAI_WORKS||[];
    const grid=document.getElementById('work-grid');
    const section=document.getElementById('works');
    if(!grid||!section||!works.length)return;

    const style=document.createElement('style');
    style.textContent=`
      .archive-tools{display:grid;grid-template-columns:minmax(220px,1fr) minmax(160px,220px) auto;gap:10px;margin:0 0 22px}
      .archive-tools input,.archive-tools select,.archive-tools button{min-height:44px;border:1px solid var(--line);background:#13110f;color:var(--ink);padding:0 13px;font:inherit}
      .archive-tools input::placeholder{color:var(--dim)}
      .archive-tools button{cursor:pointer;color:#f1dfbd;border-color:#5b4931}
      .archive-tools button:hover{background:#211b13}
      .archive-result{grid-column:1/-1;margin:0;color:var(--muted);font-size:.9rem}
      .work-card[hidden]{display:none}
      .series-detail-link{display:inline-flex;min-height:44px;align-items:center;margin-top:14px;padding:0 13px;border:1px solid var(--line);background:#21150f;color:#f0dfc0;text-decoration:none}
      .series-detail-link:hover{border-color:var(--gold)}
      @media(max-width:720px){.archive-tools{grid-template-columns:1fr}.archive-result{grid-column:1}}
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
    tools.setAttribute('aria-label','作品を検索・絞り込み');

    const search=document.createElement('input');
    search.type='search';
    search.placeholder='作品名・あらすじ・IDで検索';
    search.setAttribute('aria-label','作品検索');

    const series=document.createElement('select');
    series.setAttribute('aria-label','シリーズで絞り込み');
    const options=['すべてのシリーズ',...Object.keys(window.KYOKAI_SERIES||{})];
    options.forEach((name,index)=>{
      const option=document.createElement('option');
      option.value=index===0?'':name;
      option.textContent=name;
      series.appendChild(option);
    });

    const random=document.createElement('button');
    random.type='button';
    random.textContent='ランダムに1話読む';

    const result=document.createElement('p');
    result.className='archive-result';
    result.setAttribute('aria-live','polite');

    tools.append(search,series,random,result);
    grid.parentNode.insertBefore(tools,grid);

    const cards=[...grid.querySelectorAll('.work-card')];
    let visibleWorks=[...works];

    const normalize=value=>String(value||'').toLocaleLowerCase('ja');
    const apply=()=>{
      const query=normalize(search.value).trim();
      const selected=series.value;
      visibleWorks=[];

      cards.forEach((card,index)=>{
        const work=works[index];
        const text=normalize(`${work.id} ${work.title} ${work.desc} ${work.series}`);
        const shown=(!selected||work.series===selected)&&(!query||text.includes(query));
        card.hidden=!shown;
        if(shown)visibleWorks.push(work);
      });

      result.textContent=`${visibleWorks.length}話を表示中（全${works.length}話）`;
    };

    search.addEventListener('input',apply);
    series.addEventListener('change',apply);
    random.addEventListener('click',()=>{
      if(!visibleWorks.length){
        result.textContent='条件に合う作品がありません。';
        return;
      }
      const work=visibleWorks[Math.floor(Math.random()*visibleWorks.length)];
      location.href=`/kyokai-yawa/stories/${work.file}`;
    });

    apply();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
