import fs from 'node:fs';
import path from 'node:path';

const base='https://allsunday1122.github.io/kyokai-yawa/';
const started=new Date();
const errors=[];
const warnings=[];
const checks=[];

const request=async(label,url,expectedType='')=>{
  const start=Date.now();
  try{
    const response=await fetch(url,{cache:'no-store',headers:{'cache-control':'no-cache'}});
    const body=await response.text();
    const type=response.headers.get('content-type')||'';
    checks.push({label,status:response.status,type,ms:Date.now()-start});
    if(!response.ok)errors.push(`${label}: HTTP ${response.status}`);
    if(expectedType&&!type.includes(expectedType))errors.push(`${label}: Content-Typeが${expectedType}ではありません（${type}）`);
    return body;
  }catch(error){
    checks.push({label,status:'-',type:'-',ms:Date.now()-start});
    errors.push(`${label}: 取得失敗（${error.message}）`);
    return '';
  }
};

const top=await request('トップページ',`${base}?reading-path-audit=${Date.now()}`,'text/html');
const css=await request('選び方別CSS',`${base}data/reading-paths.css`,'text/css');
const tools=await request('作品検索JavaScript',`${base}data/archive-tools.js`,'javascript');
const section=top.match(/<!-- READING_PATHS_START -->([\s\S]*?)<!-- READING_PATHS_END -->/)?.[1]||'';
const cardCount=(section.match(/data-reading-path=/g)||[]).length;
if(cardCount!==5)errors.push(`本番の選び方カードが5件ではありません（${cardCount}件）`);
if(!top.includes('href="#discover">選び方</a>'))errors.push('本番トップメニューに「選び方」がありません');
if(!top.includes('/kyokai-yawa/data/reading-paths.css'))errors.push('本番トップにreading-paths.css参照がありません');
if(!css.includes('.reading-path-grid'))errors.push('本番CSSにreading-path-gridがありません');
for(const value of ['quick','fear5','standalone','serial','long']){
  if(!section.includes(`/?pick=${value}#works`))errors.push(`本番に${value}一覧リンクがありません`);
  if(!tools.includes(`value:'${value}'`))errors.push(`本番検索JavaScriptに${value}フィルターがありません`);
}
if(!tools.includes("params.get('pick')"))errors.push('本番検索JavaScriptがURL条件を復元しません');

const representativePaths=[...new Set([...section.matchAll(/href=["'](\/kyokai-yawa\/stories\/[^"']+)["']/g)].map(match=>match[1]))];
if(representativePaths.length!==15)errors.push(`本番の静的代表作リンクが15件ではありません（${representativePaths.length}件）`);
for(const [index,storyPath] of representativePaths.entries()){
  await request(`代表作${index+1}`,`https://allsunday1122.github.io${storyPath}`,'text/html');
}

const times=checks.map(check=>check.ms).sort((a,b)=>a-b);
const median=times.length?times[Math.floor(times.length/2)]:0;
const p95=times.length?times[Math.min(times.length-1,Math.ceil(times.length*.95)-1)]:0;
const report=[
  '# 境界夜話 本番選び方別作品導線監査','',
  `- 実行日時: ${started.toISOString()}`,
  `- 選び方カード: ${cardCount}件`,
  `- 代表作リンク: ${representativePaths.length}件`,
  `- 絞り込み条件: 5種類`,
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  `- 応答時間中央値: ${median}ms`,
  `- 応答時間p95: ${p95}ms`,'',
  '## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'',
  '## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),'',
  '## 配信確認','',
  '| 対象 | HTTP | Content-Type | 応答 |','|---|---:|---|---:|',
  ...checks.map(check=>`| ${check.label} | ${check.status} | ${check.type} | ${check.ms}ms |`),'',
].join('\n');
fs.mkdirSync(path.join(process.cwd(),'reports'),{recursive:true});
fs.writeFileSync(path.join(process.cwd(),'reports','live-reading-paths-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
