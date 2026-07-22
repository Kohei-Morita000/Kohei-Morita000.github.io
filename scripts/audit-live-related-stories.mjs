import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const base='https://allsunday1122.github.io/kyokai-yawa/';
const context={window:{}};
const worksPath=path.join(root,'data','works.js');
vm.runInNewContext(fs.readFileSync(worksPath,'utf8'),context,{filename:worksPath});
const works=context.window.KYOKAI_WORKS||[];
const taxonomyPath=path.join(root,'data','story-taxonomy.json');
const taxonomy=fs.existsSync(taxonomyPath)?JSON.parse(fs.readFileSync(taxonomyPath,'utf8')):{};
const byId=new Map(works.map(work=>[work.id,work]));
const errors=[];
const warnings=[];
const rows=[];
const timings=[];

const fetchText=async(label,url,expectedType)=>{
  const started=Date.now();
  try{
    const response=await fetch(url,{cache:'no-store',headers:{'user-agent':'kyokai-yawa-live-related-audit/1.0'}});
    const elapsed=Date.now()-started;
    timings.push(elapsed);
    const type=response.headers.get('content-type')||'';
    rows.push({label,status:response.status,type,elapsed});
    if(response.status!==200)errors.push(`${label}: HTTP ${response.status}`);
    if(expectedType&&!type.includes(expectedType))errors.push(`${label}: Content-Typeが${expectedType}ではありません（${type||'なし'}）`);
    return await response.text();
  }catch(error){
    const elapsed=Date.now()-started;
    timings.push(elapsed);
    rows.push({label,status:'ERR',type:'-',elapsed});
    errors.push(`${label}: 取得失敗 ${error.message}`);
    return '';
  }
};

await fetchText('関連作品CSS',`${base}data/related-stories.css`,'text/css');
const batchSize=8;
for(let start=0;start<works.length;start+=batchSize){
  const batch=works.slice(start,start+batchSize);
  await Promise.all(batch.map(async work=>{
    const html=await fetchText(work.id,`${base}stories/${work.file}`,'text/html');
    if(!html)return;
    const info=taxonomy[work.id];
    if(!info){errors.push(`${work.id}: ローカル分類データがありません`);return;}
    if(!html.includes('<!-- RELATED_STORIES_START -->')||!html.includes('<!-- RELATED_STORIES_END -->'))errors.push(`${work.id}: 本番HTMLに関連作品マーカーがありません`);
    if(!html.includes('/kyokai-yawa/data/related-stories.css'))errors.push(`${work.id}: 本番HTMLに関連作品CSS参照がありません`);
    const section=html.match(/<!-- RELATED_STORIES_START -->([\s\S]*?)<!-- RELATED_STORIES_END -->/)?.[1]||'';
    const tagCount=(section.match(/class="story-tag"/g)||[]).length;
    if(tagCount!==info.tags.length)errors.push(`${work.id}: 本番の題材タグ数が不正です（${tagCount}件）`);
    if(!section.includes(info.aftertaste))errors.push(`${work.id}: 本番に読後感がありません`);
    const relatedIds=[...section.matchAll(/data-related-id="([^"]+)"/g)].map(match=>match[1]);
    if(JSON.stringify(relatedIds)!==JSON.stringify(info.related))errors.push(`${work.id}: 本番の関連作品3話が分類データと一致しません`);
    for(const id of info.related){
      const target=byId.get(id);
      if(!target||!section.includes(`/kyokai-yawa/stories/${target.file}`))errors.push(`${work.id}: 本番に${id}への静的リンクがありません`);
    }
  }));
}

const sorted=[...timings].sort((a,b)=>a-b);
const percentile=p=>sorted.length?sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)]:0;
const median=percentile(.5);
const p95=percentile(.95);
const report=[
  '# 境界夜話 本番題材タグ・関連作品監査',
  '',
  `- 実行日時: ${new Date().toISOString()}`,
  `- 作品HTML: ${works.length}ページ`,
  `- 分類データ: ${Object.keys(taxonomy).length}件`,
  `- 関連作品リンク予定: ${works.length*3}件`,
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  `- 応答時間中央値: ${median}ms`,
  `- 応答時間p95: ${p95}ms`,
  '',
  '## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),
  '',
  '## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),
  '',
  '## 配信確認','',
  '| 対象 | HTTP | Content-Type | 応答 |',
  '|---|---:|---|---:|',
  ...rows.map(row=>`| ${row.label} | ${row.status} | ${row.type} | ${row.elapsed}ms |`),
  '',
].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','live-related-stories-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
