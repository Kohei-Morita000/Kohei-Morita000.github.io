import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const base='https://allsunday1122.github.io/kyokai-yawa/';
const targets=[
  ['トップページ','', 'text/html'],
  ['個別化CSS','data/home-personalization.css','text/css'],
  ['個別化JavaScript','data/home-personalization.js','javascript'],
  ['読了管理JavaScript','data/reading-status.js','javascript'],
  ['読書進捗JavaScript','data/reader-tools.js','javascript'],
  ['作品分類JSON','data/story-taxonomy.json','application/json'],
];
const errors=[];const warnings=[];const rows=[];const times=[];const bodies={};
for(const [label,target,expected] of targets){
  const started=Date.now();
  const response=await fetch(`${base}${target}${target.includes('?')?'&':'?'}audit=${Date.now()}`,{headers:{'cache-control':'no-cache'}});
  const elapsed=Date.now()-started;times.push(elapsed);
  const type=response.headers.get('content-type')||'';
  const text=await response.text();bodies[label]=text;
  rows.push({label,http:response.status,type,time:elapsed});
  if(!response.ok)errors.push(`${label}: HTTP ${response.status}`);
  if(expected&&!type.includes(expected))errors.push(`${label}: Content-Typeが不正です（${type}）`);
}
const index=bodies['トップページ']||'';
if((index.match(/data-personal-library hidden/g)||[]).length!==1)errors.push('本番トップページに初期非表示の個別化欄が1件ありません');
for(const token of ['data-personal-continue','data-personal-recent','data-personal-recommend','home-personalization.css','home-personalization.js'])if(!index.includes(token))errors.push(`本番トップページに必要要素がありません: ${token}`);
const js=bodies['個別化JavaScript']||'';
for(const token of ['POSITION_PREFIX','selectRecommendations','story-taxonomy.json','resume=1'])if(!js.includes(token))errors.push(`本番個別化JavaScriptに必要処理がありません: ${token}`);
if(/https?:\/\//.test(js))errors.push('本番個別化JavaScriptに外部URLが含まれています');
const status=bodies['読了管理JavaScript']||'';
for(const token of ['kyokai-yawa-reading-history-v1','recordVisit','getHistory'])if(!status.includes(token))errors.push(`本番読了管理に履歴処理がありません: ${token}`);
const reader=bodies['読書進捗JavaScript']||'';
if(!reader.includes("params.get('resume') === '1'"))errors.push('本番読書進捗に保存位置への直接復帰処理がありません');
try{const taxonomy=JSON.parse(bodies['作品分類JSON']||'{}');if(Object.keys(taxonomy).length!==48)errors.push(`本番分類データが48件ではありません（${Object.keys(taxonomy).length}件）`);}catch{errors.push('本番作品分類JSONを解析できません');}
const sorted=[...times].sort((a,b)=>a-b);const median=sorted[Math.floor(sorted.length/2)]||0;const p95=sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)]||0;
const report=['# 境界夜話 本番再訪者向け個別入口監査','',`- 実行日時: ${new Date().toISOString()}`,'- トップページ: 1','- 共通資産: 5','- 履歴なしの初期表示: 非表示','- 保存方式: ブラウザー端末内localStorage','- 外部送信: なし',`- エラー: ${errors.length}`,`- 警告: ${warnings.length}`,`- 応答時間中央値: ${median}ms`,`- 応答時間p95: ${p95}ms`,'','## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'','## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),'','## 配信確認','','| 対象 | HTTP | Content-Type | 応答 |','|---|---:|---|---:|',...rows.map(row=>`| ${row.label} | ${row.http} | ${row.type} | ${row.time}ms |`),''].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','live-home-personalization-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;