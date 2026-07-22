(()=>{
  const POSITION_PREFIX='kyokai-yawa-reader-position:';
  const section=document.querySelector('[data-personal-library]');
  if(!section)return;
  const works=Array.isArray(window.KYOKAI_WORKS)?window.KYOKAI_WORKS:[];
  const status=window.KYOKAI_READING_STATUS;
  if(!works.length||!status)return;
  const byId=new Map(works.map(work=>[work.id,work]));
  const minutes=work=>Number.parseInt(String(work?.mins||'').match(/\d+/)?.[0]||'0',10);
  const safeGet=key=>{try{return localStorage.getItem(key);}catch{return null;}};
  const positionFor=work=>{
    const ratio=Number.parseFloat(safeGet(`${POSITION_PREFIX}/kyokai-yawa/stories/${work.file}`)||'');
    return Number.isFinite(ratio)&&ratio>=0.08&&ratio<0.93?ratio:null;
  };
  const historyTime=(history,id)=>Math.max(Number(history.visits?.[id]||0),Number(history.completions?.[id]||0));
  const storyHref=(work,resume=false)=>`/kyokai-yawa/stories/${work.file}${resume?'?resume=1#story':''}`;
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const formatRecent=timestamp=>{
    if(!timestamp)return '';
    const diff=Math.max(0,Date.now()-timestamp);
    if(diff<60*60*1000)return `${Math.max(1,Math.floor(diff/60000))}分前`;
    if(diff<24*60*60*1000)return `${Math.floor(diff/(60*60*1000))}時間前`;
    return `${Math.floor(diff/(24*60*60*1000))}日前`;
  };
  const renderStory=(work,{state='',note='',ratio=null,resume=false}={})=>{
    const progress=ratio===null?'':`<div class="personal-progress" aria-label="本文${Math.round(ratio*100)}%まで読了"><span style="transform:scaleX(${Math.min(1,Math.max(0,ratio))})"></span></div>`;
    return `<a class="personal-story" data-personal-story-id="${escapeHtml(work.id)}" href="${storyHref(work,resume)}"><span class="personal-story-head"><span class="personal-story-id">${escapeHtml(work.id)} · ${escapeHtml(work.series)}</span><span class="personal-story-state">${escapeHtml(state)}</span></span><strong>${escapeHtml(work.title)}</strong>${note?`<p>${escapeHtml(note)}</p>`:''}<span class="personal-story-meta"><span>${escapeHtml(work.mins)}</span><span>恐怖${escapeHtml(work.fear)}</span><span>${escapeHtml(work.length)}</span></span>${progress}</a>`;
  };
  let taxonomyPromise;
  const loadTaxonomy=()=>taxonomyPromise||(taxonomyPromise=fetch('/kyokai-yawa/data/story-taxonomy.json',{cache:'force-cache'}).then(response=>response.ok?response.json():{}).catch(()=>({})));
  const selectRecommendations=(taxonomy,history,excluded)=>{
    const read=new Set(status.getReadIds());
    const contextIds=Object.keys({...history.visits,...history.completions}).filter(id=>byId.has(id)).sort((a,b)=>historyTime(history,b)-historyTime(history,a)).slice(0,5);
    const contextTags=new Map();
    for(const id of contextIds){for(const tag of taxonomy[id]?.tags||[])contextTags.set(tag,(contextTags.get(tag)||0)+1);}
    const recentWorks=contextIds.map(id=>byId.get(id)).filter(Boolean);
    const scored=works.filter(work=>!read.has(work.id)&&!excluded.has(work.id)).map((work,index)=>{
      const tags=taxonomy[work.id]?.tags||[];
      const shared=tags.filter(tag=>contextTags.has(tag));
      let score=shared.reduce((sum,tag)=>sum+(contextTags.get(tag)||0)*5,0);
      for(const recent of recentWorks){if(recent.series===work.series)score+=2;if(Math.abs(minutes(recent)-minutes(work))<=2)score+=1;if(Math.abs(Number(recent.fear)-Number(work.fear))<=1)score+=1;}
      return {work,index,score,shared};
    }).sort((a,b)=>b.score-a.score||a.index-b.index);
    const selected=[];const seriesUsed=new Set();
    for(const item of scored){if(selected.length>=3)break;if(seriesUsed.has(item.work.series))continue;selected.push(item);seriesUsed.add(item.work.series);}
    for(const item of scored){if(selected.length>=3)break;if(selected.some(chosen=>chosen.work.id===item.work.id))continue;selected.push(item);}
    return selected;
  };
  const refresh=async()=>{
    const history=status.getHistory?.()||{visits:{},completions:{}};
    const inProgress=works.map(work=>({work,ratio:positionFor(work),time:historyTime(history,work.id)})).filter(item=>item.ratio!==null).sort((a,b)=>b.time-a.time||b.ratio-a.ratio);
    const readIds=status.getReadIds();
    const hasHistory=inProgress.length||readIds.length||Object.keys(history.visits||{}).length||Object.keys(history.completions||{}).length;
    if(!hasHistory){section.hidden=true;return;}
    const excluded=new Set();
    const continuePanel=section.querySelector('[data-personal-continue]');
    const continueList=continuePanel.querySelector('[data-personal-list]');
    if(inProgress.length){const item=inProgress[0];excluded.add(item.work.id);continuePanel.hidden=false;continueList.innerHTML=renderStory(item.work,{state:`${Math.round(item.ratio*100)}%`,note:'保存した本文位置から再開します。',ratio:item.ratio,resume:true});}
    else continuePanel.hidden=true;
    const recentPanel=section.querySelector('[data-personal-recent]');
    const recentList=recentPanel.querySelector('[data-personal-list]');
    const recentIds=[...new Set([...Object.keys(history.completions||{}),...Object.keys(history.visits||{})])].filter(id=>byId.has(id)&&!excluded.has(id)).sort((a,b)=>historyTime(history,b)-historyTime(history,a)).slice(0,3);
    if(recentIds.length){recentPanel.hidden=false;recentList.innerHTML=recentIds.map(id=>{excluded.add(id);const work=byId.get(id);const completed=Number(history.completions?.[id]||0);return renderStory(work,{state:status.isRead(id)?'読了済み':'閲覧済み',note:`${formatRecent(Math.max(completed,Number(history.visits?.[id]||0)))}に${completed?'読了':'閲覧'}`});}).join('');}
    else recentPanel.hidden=true;
    const recommendationPanel=section.querySelector('[data-personal-recommend]');
    const recommendationList=recommendationPanel.querySelector('[data-personal-list]');
    const taxonomy=await loadTaxonomy();
    const recommendations=selectRecommendations(taxonomy,history,excluded);
    if(recommendations.length){recommendationPanel.hidden=false;recommendationList.innerHTML=recommendations.map(item=>{const reason=item.shared.length?`最近読んだ作品と「${item.shared.slice(0,2).join('」「')}」が共通`:`未読作品から、読了時間と恐怖度が近い一話`;return renderStory(item.work,{state:'未読',note:reason});}).join('');}
    else recommendationPanel.hidden=true;
    if(continuePanel.hidden&&recentPanel.hidden&&recommendationPanel.hidden){section.hidden=true;return;}
    section.hidden=false;
    if(!document.querySelector('.nav-links [data-personal-nav]')){const link=document.createElement('a');link.href='#your-library';link.dataset.personalNav='';link.textContent='続き';document.querySelector('.nav-links')?.prepend(link);}
  };
  document.addEventListener('kyokai-reading-status-change',refresh);
  document.addEventListener('kyokai-reading-history-change',refresh);
  addEventListener('storage',event=>{if(event.key===status.key||event.key===status.historyKey||event.key?.startsWith(POSITION_PREFIX))refresh();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();