import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const base='https://allsunday1122.github.io/kyokai-yawa/';
const context={window:{}};
const worksPath=path.join(root,'data','works.js');
vm.runInNewContext(fs.readFileSync(worksPath,'utf8'),context,{filename:worksPath});
const works=context.window.KYOKAI_WORKS||[];
const errors=[];
const warnings=[];
const rows=[];
const configs={
  '真壁夜話':'makabe.html',
  '黒瀬蒐集録':'kurose.html',
  '榊家異聞':'sakaki.html',
  '境界観測記':'kansoku.html',
};

for(const [name,file] of Object.entries(configs)){
  const filePath=path.join(root,'series',file);
  if(!fs.existsSync(filePath)){
    errors.push(`${name}: series/${file}が存在しません`);
    continue;
  }
  const html=fs.readFileSync(filePath,'utf8');
  const group=works.filter(work=>work.series===name);
  const expectedCanonical=`${base}series/${file}`;
  const storyLinks=[...html.matchAll(/href=["']\/kyokai-yawa\/stories\/([^"']+)["']/g)].map(match=>match[1]);
  const uniqueLinks=new Set(storyLinks);
  const jsonText=html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i)?.[1];
  if(!html.includes(`<link rel="canonical" href="${expectedCanonical}">`))errors.push(`${name}: canonicalが不正です`);
  if(!html.includes('/kyokai-yawa/data/series-pages.css'))errors.push(`${name}: 共通CSS参照がありません`);
  if(!html.includes('/kyokai-yawa/data/sw-register.js'))errors.push(`${name}: Service Worker登録がありません`);
  if(!html.includes('<meta name="robots" content="index,follow,max-snippet:-1">'))errors.push(`${name}: robots設定が不正です`);
  if(uniqueLinks.size!==12)errors.push(`${name}: 静的作品リンクが12件ではありません（${uniqueLinks.size}件）`);
  for(const work of group)if(!uniqueLinks.has(work.file))errors.push(`${name}: ${work.id}へのリンクがありません`);
  if((html.match(/class="story-card"/g)||[]).length!==12)errors.push(`${name}: story-cardが12件ではありません`);
  if((html.match(/class="other-series-list"/g)||[]).length!==1)errors.push(`${name}: 他シリーズ導線がありません`);
  if(!jsonText)errors.push(`${name}: JSON-LDがありません`);
  else{
    try{
      const json=JSON.parse(jsonText);
      const graph=json['@graph']||[];
      const list=graph.find(item=>item['@type']==='ItemList');
      const series=graph.find(item=>item['@type']==='CreativeWorkSeries');
      if(!list||list.numberOfItems!==12)errors.push(`${name}: ItemListが12件ではありません`);
      if(!series||!Array.isArray(series.hasPart)||series.hasPart.length!==12)errors.push(`${name}: CreativeWorkSeriesのhasPartが12件ではありません`);
    }catch(error){errors.push(`${name}: JSON-LDが不正です（${error.message}）`);}
  }
  rows.push({name,file,links:uniqueLinks.size,cards:(html.match(/class="story-card"/g)||[]).length});
}

const indexHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!indexHtml.includes('/kyokai-yawa/data/series-links.js'))errors.push('トップページにseries-links.js参照がありません');
for(const file of Object.values(configs)){
  const href=`/kyokai-yawa/series/${file}`;
  if(!indexHtml.includes(href))errors.push(`トップページに${href}の静的リンクがありません`);
}

const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const sitemapUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
const expectedCount=1+Object.keys(configs).length+works.length;
if(sitemapUrls.length!==expectedCount)errors.push(`sitemap URLが${expectedCount}件ではありません（${sitemapUrls.length}件）`);
for(const file of Object.values(configs)){
  const url=`${base}series/${file}`;
  if(!sitemapUrls.includes(url))errors.push(`sitemapに${url}がありません`);
}

const report=[
  '# 境界夜話 シリーズ専用ページ監査','',
  `- シリーズページ: ${rows.length}/${Object.keys(configs).length}`,
  `- 公開作品: ${works.length}話`,
  `- sitemap URL: ${sitemapUrls.length}/${expectedCount}`,
  '- 各ページ: 特徴・読む順番・初読案内・全12話・他シリーズ導線',
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,'',
  '## エラー','',...(errors.length?errors.map(error=>`- ${error}`):['- なし']),'',
  '## 警告','',...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),'',
  '## ページ別確認','',
  '| シリーズ | ファイル | 作品リンク | カード |','|---|---|---:|---:|',
  ...rows.map(row=>`| ${row.name} | ${row.file} | ${row.links} | ${row.cards} |`),'',
].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','series-pages-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
