import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const base='https://allsunday1122.github.io/kyokai-yawa/';
const context={window:{}};
const worksPath=path.join(root,'data','works.js');
vm.runInNewContext(fs.readFileSync(worksPath,'utf8'),context,{filename:worksPath});
const works=context.window.KYOKAI_WORKS||[];
const taxonomy=JSON.parse(fs.readFileSync(path.join(root,'data','story-taxonomy.json'),'utf8'));
const errors=[];
const warnings=[];
const rows=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const get=async(label,url)=>{
  const started=Date.now();
  try{
    const response=await fetch(`${url}${url.includes('?')?'&':'?'}audit=${Date.now()}`,{cache:'no-store',headers:{'user-agent':'kyokai-yawa-live-audit'}});
    const text=await response.text();
    const elapsed=Date.now()-started;
    rows.push({label,status:response.status,type:response.headers.get('content-type')||'',elapsed});
    if(!response.ok)errors.push(`${label}: HTTP ${response.status}`);
    return {response,text,elapsed};
  }catch(error){
    const elapsed=Date.now()-started;
    rows.push({label,status:0,type:'',elapsed});
    errors.push(`${label}: 取得失敗 ${error.message}`);
    return {response:null,text:'',elapsed};
  }
};

let indexResult=null;
for(let attempt=1;attempt<=30;attempt++){
  errors.length=0;
  rows.length=0;
  indexResult=await get('トップページ',base);
  const cardCount=(indexResult.text.match(/data-work-id="[^"]+"/g)||[]).length;
  const cssReady=indexResult.text.includes('/kyokai-yawa/data/work-cards.css');
  if(indexResult.response?.ok&&cardCount===works.length&&cssReady)break;
  if(attempt<30)await sleep(10000);
}

const cssResult=await get('作品カードCSS',`${base}data/work-cards.css`);
const jsResult=await get('作品検索JavaScript',`${base}data/archive-tools.js`);
const html=indexResult?.text||'';
const block=html.match(/<!-- STATIC_WORKS_START -->([\s\S]*?)<!-- STATIC_WORKS_END -->/)?.[1]||'';
const cards=[...block.matchAll(/<a class="work-card"[\s\S]*?<\/a>/g)].map(match=>match[0]);
if(cards.length!==works.length)errors.push(`本番作品カードが${works.length}件ではありません（${cards.length}件）`);
const cssRefs=(html.match(/\/kyokai-yawa\/data\/work-cards\.css/g)||[]).length;
if(cssRefs!==1)errors.push(`本番作品カードCSS参照が1件ではありません（${cssRefs}件）`);

let topicCount=0;
let standaloneCount=0;
let serialCount=0;
for(let index=0;index<works.length;index++){
  const work=works[index];
  const card=cards[index]||'';
  const tags=taxonomy[work.id]?.tags?.slice(0,4)||[];
  const serial=work.series==='境界観測記';
  if(!card.includes(`data-work-id="${work.id}"`))errors.push(`${work.id}: 本番カード順またはIDが一致しません`);
  if(!card.includes(`href="/kyokai-yawa/stories/${work.file}"`))errors.push(`${work.id}: 本番作品リンクが一致しません`);
  if(!card.includes(`<strong>${work.mins}</strong>`))errors.push(`${work.id}: 本番読了目安が一致しません`);
  if(!card.includes(`<strong>${Number(work.fear)} / 5</strong>`))errors.push(`${work.id}: 本番恐怖度が一致しません`);
  const visibleTags=[...card.matchAll(/class="work-topic-tag">([^<]+)<\/span>/g)].map(match=>match[1]);
  topicCount+=visibleTags.length;
  if(JSON.stringify(visibleTags)!==JSON.stringify(tags))errors.push(`${work.id}: 本番題材タグが一致しません`);
  if(serial){
    serialCount++;
    if(!card.includes('data-format="serial"')||!card.includes('連作・順番推奨'))errors.push(`${work.id}: 本番連作表示がありません`);
  }else{
    standaloneCount++;
    if(!card.includes('data-format="standalone"')||!card.includes('一話完結'))errors.push(`${work.id}: 本番一話完結表示がありません`);
  }
}
if(topicCount!==works.length*4)errors.push(`本番題材タグが${works.length*4}件ではありません（${topicCount}件）`);
if(standaloneCount!==36)errors.push(`本番一話完結表示が36件ではありません（${standaloneCount}件）`);
if(serialCount!==12)errors.push(`本番連作表示が12件ではありません（${serialCount}件）`);
if(!cssResult.text.includes('.work-topic-tag')||!cssResult.text.includes('@media(max-width:430px)'))errors.push('本番作品カードCSSの主要スタイルが不足しています');
if(!jsResult.text.includes('作品名・題材・あらすじ・IDで検索')||!jsResult.text.includes("card.dataset.tags||''"))errors.push('本番検索JavaScriptが題材検索へ対応していません');

const times=rows.map(row=>row.elapsed).sort((a,b)=>a-b);
const percentile=value=>times.length?times[Math.min(times.length-1,Math.floor((times.length-1)*value))]:0;
const report=[
  '# 境界夜話 本番トップ作品カード比較表示監査','',
  `- 実行日時: ${new Date().toISOString()}`,
  `- 作品カード: ${cards.length}件`,
  `- 共通資産: 2件`,
  `- 題材タグ表示: ${topicCount}件`,
  `- 一話完結表示: ${standaloneCount}件`,
  `- 連作・順番推奨表示: ${serialCount}件`,
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  `- 応答時間中央値: ${percentile(.5)}ms`,
  `- 応答時間p95: ${percentile(.95)}ms`,'',
  '## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'',
  '## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),'',
  '## 配信確認','',
  '| 対象 | HTTP | Content-Type | 応答 |','|---|---:|---|---:|',
  ...rows.map(row=>`| ${row.label} | ${row.status} | ${row.type||'-'} | ${row.elapsed}ms |`),'',
].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','live-work-cards-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
