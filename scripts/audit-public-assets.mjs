import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const root=process.cwd();
const storyDir=path.join(root,'stories');
const reportsDir=path.join(root,'reports');
const htmlFiles=[
  path.join(root,'index.html'),
  ...fs.readdirSync(storyDir).filter(name=>name.endsWith('.html')).sort().map(name=>path.join(storyDir,name)),
];
const errors=[];
const warnings=[];
const rows=[];
const referencedAssets=new Set();
const styleGroups=new Map();

const rel=file=>path.relative(root,file).replaceAll(path.sep,'/');
const bytes=value=>Buffer.byteLength(value,'utf8');
const kib=value=>(value/1024).toFixed(1);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,12);
const localPath=url=>{
  const clean=url.split(/[?#]/)[0];
  if(!clean.startsWith('/kyokai-yawa/'))return null;
  const sub=clean.slice('/kyokai-yawa/'.length);
  if(!sub)return 'index.html';
  if(sub.endsWith('/'))return `${sub}index.html`;
  return sub;
};

for(const file of htmlFiles){
  const name=rel(file);
  const html=fs.readFileSync(file,'utf8');
  const raw=bytes(html);
  const gzip=zlib.gzipSync(Buffer.from(html)).length;
  const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match=>match[1]);
  const inlineStyleBytes=styles.reduce((sum,style)=>sum+bytes(style),0);
  const inlineScriptBytes=[...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)]
    .reduce((sum,match)=>sum+bytes(match[1]),0);
  const assetUrls=[...html.matchAll(/(?:src|href)="([^"]+)"/gi)].map(match=>match[1]);
  const localAssets=[];

  for(const url of assetUrls){
    const asset=localPath(url);
    if(!asset||asset.endsWith('.html')||asset.startsWith('#'))continue;
    referencedAssets.add(asset);
    localAssets.push(asset);
    if(!fs.existsSync(path.join(root,asset)))errors.push(`${name}: 参照先 ${asset} が存在しません`);
  }

  for(const style of styles){
    const key=hash(style);
    if(!styleGroups.has(key))styleGroups.set(key,{bytes:bytes(style),pages:[]});
    styleGroups.get(key).pages.push(name);
  }

  if(raw>120*1024)errors.push(`${name}: HTMLが120KiBを超えています（${kib(raw)}KiB）`);
  else if(raw>60*1024)warnings.push(`${name}: HTMLが60KiBを超えています（${kib(raw)}KiB）`);
  if(gzip>40*1024)warnings.push(`${name}: gzip後HTMLが40KiBを超えています（${kib(gzip)}KiB）`);
  if(inlineStyleBytes>12*1024)warnings.push(`${name}: インラインCSSが12KiBを超えています（${kib(inlineStyleBytes)}KiB）`);
  if(new Set(localAssets).size!==localAssets.length)warnings.push(`${name}: 同じ公開資産を重複読み込みしています`);

  rows.push({name,raw,gzip,style:inlineStyleBytes,script:inlineScriptBytes,requests:new Set(localAssets).size});
}

const listFiles=dir=>{
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?listFiles(full):[full];
  });
};
const publicAssets=listFiles(path.join(root,'data'))
  .map(rel)
  .filter(name=>/\.(?:js|css)$/i.test(name));
const unusedAssets=publicAssets.filter(asset=>!referencedAssets.has(asset));
for(const asset of unusedAssets)warnings.push(`未参照の公開資産: ${asset}`);

const repeatedStyles=[...styleGroups.entries()]
  .filter(([,group])=>group.pages.length>=2)
  .sort((a,b)=>(b[1].bytes*(b[1].pages.length-1))-(a[1].bytes*(a[1].pages.length-1)));
const potentialSavings=repeatedStyles.reduce((sum,[,group])=>sum+group.bytes*(group.pages.length-1),0);
const totalRaw=rows.reduce((sum,row)=>sum+row.raw,0);
const totalGzip=rows.reduce((sum,row)=>sum+row.gzip,0);
const maxRaw=[...rows].sort((a,b)=>b.raw-a.raw)[0];
const maxGzip=[...rows].sort((a,b)=>b.gzip-a.gzip)[0];

const report=[
  '# 境界夜話 公開資産・表示速度監査',
  '',
  `- HTML対象: ${rows.length}ページ`,
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  `- HTML合計: ${kib(totalRaw)}KiB（gzip ${kib(totalGzip)}KiB）`,
  `- 最大HTML: ${maxRaw.name} ${kib(maxRaw.raw)}KiB`,
  `- 最大gzip: ${maxGzip.name} ${kib(maxGzip.gzip)}KiB`,
  `- 完全一致CSSを共通化した場合の理論削減量: ${kib(potentialSavings)}KiB`,
  '',
  '## エラー',
  '',
  ...(errors.length?errors.map(item=>`- ${item}`):['- なし']),
  '',
  '## 警告',
  '',
  ...(warnings.length?warnings.map(item=>`- ${item}`):['- なし']),
  '',
  '## ページ別容量',
  '',
  '| ページ | HTML | gzip | inline CSS | inline JS | 公開資産リクエスト |',
  '|---|---:|---:|---:|---:|---:|',
  ...rows.map(row=>`| ${row.name} | ${kib(row.raw)}KiB | ${kib(row.gzip)}KiB | ${kib(row.style)}KiB | ${kib(row.script)}KiB | ${row.requests} |`),
  '',
  '## 完全一致するインラインCSS',
  '',
  ...(repeatedStyles.length?repeatedStyles.map(([key,group])=>`- ${key}: ${group.pages.length}ページ × ${kib(group.bytes)}KiB（理論削減 ${kib(group.bytes*(group.pages.length-1))}KiB）\n  - ${group.pages.join('\n  - ')}`):['- なし']),
  '',
  '## 参照中の公開資産',
  '',
  ...[...referencedAssets].sort().map(asset=>`- ${asset}`),
  '',
].join('\n');

fs.mkdirSync(reportsDir,{recursive:true});
fs.writeFileSync(path.join(reportsDir,'public-assets-performance-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
