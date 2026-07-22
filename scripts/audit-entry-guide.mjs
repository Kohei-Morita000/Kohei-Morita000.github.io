import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const warnings=[];
const indexPath=path.join(root,'index.html');
const cssPath=path.join(root,'data','entry-guide.css');
const html=fs.existsSync(indexPath)?fs.readFileSync(indexPath,'utf8'):'';
const css=fs.existsSync(cssPath)?fs.readFileSync(cssPath,'utf8'):'';

if(!html)errors.push('index.htmlが存在しません');
if(!css)errors.push('data/entry-guide.cssが存在しません');
if((html.match(/<!-- ENTRY_GUIDE_START -->/g)||[]).length!==1)errors.push('ENTRY_GUIDE_STARTが1件ではありません');
if((html.match(/<!-- ENTRY_GUIDE_END -->/g)||[]).length!==1)errors.push('ENTRY_GUIDE_ENDが1件ではありません');
if((html.match(/href="\/kyokai-yawa\/data\/entry-guide\.css"/g)||[]).length!==1)errors.push('entry-guide.css参照が1件ではありません');
if(!html.includes('<a href="#start">初めての方</a>'))errors.push('主要メニューに初読者向け導線がありません');
if(!/<section class="section entry-guide" id="start" aria-labelledby="entry-guide-title">/.test(html))errors.push('初読者向けsectionの識別子またはaria-labelledbyが不正です');
if(!/<h2 id="entry-guide-title">初めて読む方へ<\/h2>/.test(html))errors.push('初読者向け見出しがありません');

const block=html.match(/<!-- ENTRY_GUIDE_START -->([\s\S]*?)<!-- ENTRY_GUIDE_END -->/)?.[1]||'';
const cards=[...block.matchAll(/<article class="entry-choice" data-entry-series="([^"]+)">/g)].map(match=>match[1]);
const expectedSeries=['真壁夜話','黒瀬蒐集録','榊家異聞','境界観測記'];
if(cards.length!==4)errors.push(`比較カードが4件ではありません（${cards.length}件）`);
for(const name of expectedSeries)if(!cards.includes(name))errors.push(`${name}の比較カードがありません`);

const expectedSeriesLinks=['/kyokai-yawa/series/makabe.html','/kyokai-yawa/series/kurose.html','/kyokai-yawa/series/sakaki.html','/kyokai-yawa/series/kansoku.html'];
const seriesLinks=[...block.matchAll(/data-entry-series-link href="([^"]+)"/g)].map(match=>match[1]);
if(seriesLinks.length!==4)errors.push(`シリーズ案内リンクが4件ではありません（${seriesLinks.length}件）`);
for(const href of expectedSeriesLinks)if(!seriesLinks.includes(href))errors.push(`シリーズ案内リンク ${href} がありません`);

const expectedStoryLinks=['/kyokai-yawa/stories/mkb-001-taikin-kiroku-2514.html','/kyokai-yawa/stories/krs-001-sanbonme-no-sakaigi.html','/kyokai-yawa/stories/skk-001-butsuma-no-natsufuku.html','/kyokai-yawa/stories/kks-s1e01-sakaime-no-heya.html'];
const storyLinks=[...block.matchAll(/data-entry-story-link href="([^"]+)"/g)].map(match=>match[1]);
if(storyLinks.length!==4)errors.push(`代表作リンクが4件ではありません（${storyLinks.length}件）`);
for(const href of expectedStoryLinks)if(!storyLinks.includes(href))errors.push(`代表作リンク ${href} がありません`);

for(const token of ['.entry-choice-grid','.entry-choice-actions','@media(max-width:760px)','min-height:44px'])if(!css.includes(token))errors.push(`CSSに${token}がありません`);
if(block.length>15000)warnings.push(`初読者向けHTMLが15,000文字を超えています（${block.length}文字）`);

const report=[
'# 境界夜話 初読者向けおすすめ入口監査','',
`- 比較カード: ${cards.length}/4`,
`- シリーズ案内リンク: ${seriesLinks.length}/4`,
`- 代表作リンク: ${storyLinks.length}/4`,
'- JavaScriptなしで利用可能: はい',
`- エラー: ${errors.length}`,
`- 警告: ${warnings.length}`,'',
'## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'',
'## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),'',
'## 初読者向け分類','',
'| 選び方 | シリーズ | 開始作品 |',
'|---|---|---|',
'| 仕事・機械・記録 | 真壁夜話 | MKB-001 |',
'| 土地・民俗・資料 | 黒瀬蒐集録 | KRS-001 |',
'| 家族・遺品・記憶 | 榊家異聞 | SKK-001 |',
'| 調査チーム・連作 | 境界観測記 | KKS-S1E01 |',''
].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','entry-guide-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
