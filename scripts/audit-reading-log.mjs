import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const context={window:{}};
const worksPath=path.join(root,'data','works.js');
vm.runInNewContext(fs.readFileSync(worksPath,'utf8'),context,{filename:worksPath});
const works=context.window.KYOKAI_WORKS||[];
const pagePath=path.join(root,'reading-log.html');
const page=fs.existsSync(pagePath)?fs.readFileSync(pagePath,'utf8'):'';
const js=fs.readFileSync(path.join(root,'data','reading-log.js'),'utf8');
const css=fs.readFileSync(path.join(root,'data','reading-log.css'),'utf8');
const pages=[path.join(root,'index.html'),...['makabe.html','kurose.html','sakaki.html','kansoku.html'].map(file=>path.join(root,'series',file)),...works.map(work=>path.join(root,'stories',work.file))];
const errors=[];const warnings=[];
const count=(text,pattern)=>(text.match(pattern)||[]).length;
if(works.length!==48)errors.push(`作品データが48件ではありません（${works.length}件）`);
if(!page)errors.push('reading-log.htmlがありません');
if(!page.includes('<meta name="robots" content="noindex,follow">'))errors.push('読書記録ページがnoindex,followではありません');
for(const asset of ['data/reading-log.css','data/works.js','data/reading-status.js','data/saved-stories.js','data/reading-log.js','data/sw-register.js'])if(!page.includes(`/kyokai-yawa/${asset}`))errors.push(`読書記録ページの資産参照がありません: ${asset}`);
for(const token of ['data-count-read','data-count-unread','data-count-saved','data-count-progress','data-log-query','data-log-series','data-log-state','data-log-sort','data-reading-log-grid'])if(!page.includes(token))errors.push(`読書記録ページの表示要素がありません: ${token}`);
if(page.indexOf('reading-status.js')>page.indexOf('saved-stories.js')||page.indexOf('saved-stories.js')>page.indexOf('reading-log.js'))errors.push('読書記録JavaScriptの読み込み順が不正です');
let navPages=0;
for(const file of pages){
  const relative=path.relative(root,file);if(!fs.existsSync(file)){errors.push(`${relative}: ページがありません`);continue;}
  const html=fs.readFileSync(file,'utf8');const links=count(html,/href="\/kyokai-yawa\/reading-log\.html"/g);
  if(links!==1)errors.push(`${relative}: 読書記録リンクが1件ではありません（${links}件）`);else navPages++;
}
for(const token of ['kyokai-yawa-reader-position:','getHistory','getSavedAt','dataFor','matchesState','state.value===\'progress\'','state.value===\'saved\'','reading?.toggle','saved?.toggle','params.get(\'state\')','history.replaceState'])if(!js.includes(token))errors.push(`読書記録処理がありません: ${token}`);
for(const risky of ['fetch(','sendBeacon','XMLHttpRequest','WebSocket'])if(js.includes(risky))errors.push(`読書記録JavaScriptに外部通信処理が含まれています: ${risky}`);
if(!js.includes('localStorage.getItem'))errors.push('途中位置のlocalStorage読取処理がありません');
if(!css.includes('.summary-grid')||!css.includes('.log-grid')||!css.includes('@media(max-width:620px)'))errors.push('読書記録の一覧・集計・スマートフォン向けCSSが不足しています');
if(!page.includes('このページの内容は端末ごとに異なります'))warnings.push('端末ごとに内容が異なる説明がありません');

const report=['# 境界夜話 読書記録ページ監査','',`- 公開作品: ${works.length}/48`,'- 読書記録ページ: 1','- 状態集計: 読了・未読・あとで読む・途中まで','- 状態絞り込み: 途中まで・あとで読む・未読・読了済み','- 並べ替え: 最近更新・公開順・短い順・恐怖度順',`- 読書記録への導線: ${navPages}/53ページ`,'- 作品操作: 開く・読了切替・保存切替','- 保存方式: ブラウザー端末内localStorage','- 検索エンジン: noindex,follow','- 外部送信: なし',`- エラー: ${errors.length}`,`- 警告: ${warnings.length}`,'','## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'','## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),''].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','reading-log-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;