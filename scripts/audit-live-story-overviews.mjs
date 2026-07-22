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
const timings=[];
const rows=[];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const fetchText=async(url,label)=>{
  const started=Date.now();
  try{
    const response=await fetch(url,{headers:{'user-agent':'kyokai-yawa-live-story-overview-audit/1.0'},cache:'no-store'});
    const text=await response.text();
    const elapsed=Date.now()-started;
    timings.push(elapsed);
    rows.push({label,status:response.status,type:response.headers.get('content-type')||'',elapsed});
    if(!response.ok)errors.push(`${label}: HTTP ${response.status}`);
    return {response,text};
  }catch(error){
    const elapsed=Date.now()-started;
    timings.push(elapsed);
    rows.push({label,status:'取得失敗',type:'-',elapsed});
    errors.push(`${label}: 取得失敗 ${error.message}`);
    return {response:null,text:''};
  }
};

if(works.length!==48)errors.push(`公開作品が48話ではありません（${works.length}話）`);
const readinessUrl=new URL(`stories/${works[0].file}`,base).href;
let ready=false;
for(let attempt=1;attempt<=12;attempt++){
  try{
    const response=await fetch(readinessUrl,{cache:'no-store'});
    const text=await response.text();
    if(response.ok&&text.includes('<!-- STORY_OVERVIEW_START -->')){ready=true;break;}
  }catch{}
  if(attempt<12)await delay(10000);
}
if(!ready)errors.push('GitHub Pagesで冒頭情報欄の反映を確認できませんでした');

const cssResult=await fetchText(new URL('data/story-overview.css',base).href,'冒頭情報CSS');
if(cssResult.text&&!cssResult.text.includes('.story-overview__start'))errors.push('本番CSSに本文開始リンクの定義がありません');
const readerResult=await fetchText(new URL('data/reader-tools.js',base).href,'読書設定JavaScript');
if(readerResult.text&&!readerResult.text.includes("document.querySelector('.story-overview')"))errors.push('本番の読書設定が冒頭情報欄の後へ配置されません');

const checkWork=async work=>{
  const {text}=await fetchText(new URL(`stories/${work.file}`,base).href,work.id);
  if(!text)return;
  const section=text.match(/<!-- STORY_OVERVIEW_START -->([\s\S]*?)<!-- STORY_OVERVIEW_END -->/)?.[1]||'';
  if(!section){errors.push(`${work.id}: 本番に冒頭情報欄がありません`);return;}
  if(/<p\s+class=["'][^"']*\bsummary\b/i.test(text))errors.push(`${work.id}: 本番に旧あらすじ表示が残っています`);
  if(!text.includes('/kyokai-yawa/data/story-overview.css'))errors.push(`${work.id}: 本番に冒頭情報CSS参照がありません`);
  if(!section.includes(work.mins))errors.push(`${work.id}: 本番の読了目安が不正です`);
  if(!section.includes(`5段階中${work.fear}`)||!section.includes(`${work.fear} / 5`))errors.push(`${work.id}: 本番の恐怖度が不正です`);
  const expectedFormat=work.series==='境界観測記'?'連作・順番推奨':'一話完結';
  if(!section.includes(expectedFormat))errors.push(`${work.id}: 本番の形式表示が不正です`);
  for(const tag of taxonomy[work.id]?.tags||[])if(!section.includes(`>${tag}</span>`))errors.push(`${work.id}: 本番の題材タグ「${tag}」がありません`);
  if(!section.includes('href="#story"')||!section.includes('本文を読む'))errors.push(`${work.id}: 本番の本文開始リンクがありません`);
  if(text.indexOf('<!-- STORY_OVERVIEW_START -->')>text.indexOf('<article'))errors.push(`${work.id}: 本番の冒頭情報欄が本文より後にあります`);
};

for(let index=0;index<works.length;index+=8)await Promise.all(works.slice(index,index+8).map(checkWork));
const sorted=[...timings].sort((a,b)=>a-b);
const median=sorted.length?sorted[Math.floor(sorted.length*.5)]:0;
const p95=sorted.length?sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)]:0;
const report=[
  '# 境界夜話 本番作品冒頭情報欄監査','',
  `- 実行日時: ${new Date().toISOString()}`,
  `- 作品HTML: ${works.length}ページ`,
  `- 共通資産: 2件`,
  `- 題材タグ予定: ${Object.values(taxonomy).reduce((sum,item)=>sum+(item.tags?.length||0),0)}件`,
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  `- 応答時間中央値: ${median}ms`,
  `- 応答時間p95: ${p95}ms`,'',
  '## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'',
  '## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),'',
  '## 配信確認','',
  '| 対象 | HTTP | Content-Type | 応答 |','|---|---:|---|---:|',
  ...rows.map(row=>`| ${row.label} | ${row.status} | ${row.type.replaceAll('|','\\|')} | ${row.elapsed}ms |`),'',
].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','live-story-overviews-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
