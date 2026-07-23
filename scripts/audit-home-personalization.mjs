import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const context={window:{}};
const worksPath=path.join(root,'data','works.js');
vm.runInNewContext(fs.readFileSync(worksPath,'utf8'),context,{filename:worksPath});
const works=context.window.KYOKAI_WORKS||[];
const taxonomy=JSON.parse(fs.readFileSync(path.join(root,'data','story-taxonomy.json'),'utf8'));
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const personalization=fs.readFileSync(path.join(root,'data','home-personalization.js'),'utf8');
const readingStatus=fs.readFileSync(path.join(root,'data','reading-status.js'),'utf8');
const savedStories=fs.readFileSync(path.join(root,'data','saved-stories.js'),'utf8');
const readerTools=fs.readFileSync(path.join(root,'data','reader-tools.js'),'utf8');
const css=fs.readFileSync(path.join(root,'data','home-personalization.css'),'utf8');
const errors=[];const warnings=[];

const count=(text,pattern)=>(text.match(pattern)||[]).length;
if(works.length!==48)errors.push(`作品データが48件ではありません（${works.length}件）`);
if(Object.keys(taxonomy).length!==48)errors.push(`分類データが48件ではありません（${Object.keys(taxonomy).length}件）`);
if(count(index,/<!-- HOME_PERSONALIZATION_START -->/g)!==1||count(index,/<!-- HOME_PERSONALIZATION_END -->/g)!==1)errors.push('個別化セクションマーカーが1組ではありません');
if(!index.includes('data-personal-library hidden'))errors.push('履歴なしで非表示にする個別化セクションがありません');
for(const token of ['data-personal-continue','data-personal-recent','data-personal-saved','data-personal-recommend'])if(!index.includes(token))errors.push(`個別化欄がありません: ${token}`);
if(!index.includes('/kyokai-yawa/data/home-personalization.css'))errors.push('個別化CSS参照がありません');
if(!index.includes('/kyokai-yawa/data/home-personalization.js'))errors.push('個別化JavaScript参照がありません');
const statusIndex=index.indexOf('reading-status.js');
const savedIndex=index.indexOf('saved-stories.js');
const personalizationIndex=index.indexOf('home-personalization.js');
const archiveIndex=index.indexOf('archive-tools.js');
if(statusIndex<0||savedIndex<0||personalizationIndex<0)errors.push('読了・保存・個別化JavaScriptの参照が揃っていません');
if(statusIndex>savedIndex)errors.push('読了管理JavaScriptが保存管理より後に読み込まれます');
if(savedIndex>personalizationIndex)errors.push('保存管理JavaScriptが個別化処理より後に読み込まれます');
if(statusIndex>personalizationIndex)errors.push('読了管理JavaScriptが個別化処理より後に読み込まれます');
if(personalizationIndex>archiveIndex)warnings.push('個別化JavaScriptが一覧検索より後に読み込まれます');
for(const token of ['kyokai-yawa-reading-history-v1','recordVisit','getHistory','completions','visits'])if(!readingStatus.includes(token))errors.push(`読書履歴処理がありません: ${token}`);
for(const token of ['kyokai-yawa-saved-stories-v1','getSavedIds','savedAt'])if(!savedStories.includes(token))errors.push(`保存作品処理がありません: ${token}`);
for(const token of ["params.get('resume') === '1'",'resumeToSavedPosition','history.replaceState'])if(!readerTools.includes(token))errors.push(`途中位置への直接復帰処理がありません: ${token}`);
for(const token of ['POSITION_PREFIX','data-personal-library','data-personal-continue','data-personal-recent','data-personal-saved','data-personal-recommend','story-taxonomy.json','selectRecommendations','status.getReadIds','status.getHistory','getSavedIds'])if(!personalization.includes(token))errors.push(`個別化処理がありません: ${token}`);
if(!personalization.includes("fetch('/kyokai-yawa/data/story-taxonomy.json'"))errors.push('分類データ取得が同一サイトの絶対パスではありません');
for(const token of ['AbortController','setTimeout(()=>controller.abort(),1200)','if(!continuePanel.hidden||!recentPanel.hidden','const reveal=()=>'])if(!personalization.includes(token))errors.push(`分類データ遅延時の先行表示処理がありません: ${token}`);
if(/https?:\/\//.test(personalization))errors.push('個別化JavaScriptに外部URLが含まれています');
for(const risky of ['sendBeacon','XMLHttpRequest','WebSocket'])if(personalization.includes(risky)||readingStatus.includes(risky)||savedStories.includes(risky))errors.push(`外部送信に使える処理が含まれています: ${risky}`);
if(!css.includes('.personal-library[hidden]')||!css.includes('@media(max-width:620px)'))errors.push('非表示またはスマートフォン向けCSSが不足しています');

const minutes=work=>Number.parseInt(String(work.mins).match(/\d+/)?.[0]||'0',10);
const simulate=id=>{
  const source=works.find(work=>work.id===id);if(!source)return [];
  const contextTags=new Map((taxonomy[id]?.tags||[]).map(tag=>[tag,1]));
  const scored=works.filter(work=>work.id!==id).map((work,index)=>{const shared=(taxonomy[work.id]?.tags||[]).filter(tag=>contextTags.has(tag));let score=shared.length*5;if(work.series===source.series)score+=2;if(Math.abs(minutes(work)-minutes(source))<=2)score+=1;if(Math.abs(Number(work.fear)-Number(source.fear))<=1)score+=1;return {work,index,score};}).sort((a,b)=>b.score-a.score||a.index-b.index);
  const selected=[];const series=new Set();for(const item of scored){if(selected.length>=3)break;if(series.has(item.work.series))continue;selected.push(item.work.id);series.add(item.work.series);}for(const item of scored){if(selected.length>=3)break;if(!selected.includes(item.work.id))selected.push(item.work.id);}return selected;
};
for(const work of works){const selected=simulate(work.id);if(selected.length!==3)errors.push(`${work.id}: 未読候補を3件選べません`);if(new Set(selected).size!==3||selected.includes(work.id))errors.push(`${work.id}: おすすめ候補に重複または自作品があります`);}

const report=['# 境界夜話 再訪者向け個別入口監査','',`- 公開作品: ${works.length}/48`,'- 読み込み順: 作品データ → 読了管理 → 保存管理 → 個別化','- 続きから読む: 保存位置が8〜93％の作品から最新1話','- 最近読んだ作品: 閲覧・読了時刻順で最大3話','- あとで読む: 保存順で最大3話','- 未読のおすすめ: 題材・シリーズ・時間・恐怖度から最大3話','- 先行表示: 続き・履歴・保存は分類JSONを待たず表示','- 分類JSON待機上限: 1.2秒、超過時はシリーズ・時間・恐怖度で代替選定','- 履歴・保存がない初回訪問: 非表示','- 途中位置リンク: `?resume=1`で保存位置へ移動','- 保存方式: ブラウザー端末内localStorage','- 外部送信: なし',`- エラー: ${errors.length}`,`- 警告: ${warnings.length}`,'','## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'','## 警告','',...(warnings.length?warnings.map(error=>`- ${error}`):['- なし']),''].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','home-personalization-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
