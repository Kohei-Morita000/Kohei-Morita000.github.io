import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const storyDir=path.join(root,'stories');
const dataDir=path.join(root,'data');
const minGroupSize=3;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,12);
const pages=fs.readdirSync(storyDir).filter(name=>name.endsWith('.html')).sort();
const groups=new Map();
const existingCss=new Map();
const changes=[];

for(const name of fs.readdirSync(dataDir).filter(name=>/^story-style-[a-f0-9]{12}\.css$/.test(name))){
  const content=fs.readFileSync(path.join(dataDir,name),'utf8');
  existingCss.set(hash(content),name);
}

for(const name of pages){
  const filePath=path.join(storyDir,name);
  const html=fs.readFileSync(filePath,'utf8');
  const match=html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
  if(!match)continue;
  const content=match[1];
  const key=hash(content);
  if(!groups.has(key))groups.set(key,{content,items:[]});
  groups.get(key).items.push({name,filePath,html,full:match[0]});
}

for(const [key,group] of groups){
  const existing=existingCss.get(key);
  if(!existing&&group.items.length<minGroupSize)continue;
  const cssName=existing||`story-style-${key}.css`;
  const cssPath=path.join(dataDir,cssName);
  if(!fs.existsSync(cssPath)){
    fs.writeFileSync(cssPath,group.content);
    changes.push(`${cssName}: ${group.items.length}ページの共通CSSを作成`);
  }
  const link=`<link rel="stylesheet" href="/kyokai-yawa/data/${cssName}">`;
  for(const item of group.items){
    const next=item.html.replace(item.full,link);
    if(next===item.html)throw new Error(`${item.name}: style置換に失敗しました`);
    fs.writeFileSync(item.filePath,next);
    changes.push(`${item.name}: ${cssName}を参照`);
  }
}

const referenced=new Set();
for(const name of pages){
  const html=fs.readFileSync(path.join(storyDir,name),'utf8');
  for(const match of html.matchAll(/\/kyokai-yawa\/data\/(story-style-[a-f0-9]{12}\.css)/g))referenced.add(match[1]);
}
for(const name of fs.readdirSync(dataDir).filter(name=>/^story-style-[a-f0-9]{12}\.css$/.test(name))){
  if(!referenced.has(name)){
    fs.unlinkSync(path.join(dataDir,name));
    changes.push(`${name}: 未参照のため削除`);
  }
}

console.log([
  '# 共通作品CSS正規化',
  '',
  `- 対象: ${pages.length}話`,
  `- 共通化条件: 完全一致するCSSが${minGroupSize}ページ以上`,
  `- 変更: ${changes.length}件`,
  '',
  ...(changes.length?changes.map(item=>`- ${item}`):['- 変更なし']),
].join('\n'));
