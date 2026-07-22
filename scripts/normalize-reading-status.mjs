import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const context={window:{}};
const worksPath=path.join(root,'data','works.js');
vm.runInNewContext(fs.readFileSync(worksPath,'utf8'),context,{filename:worksPath});
const works=context.window.KYOKAI_WORKS||[];
const seriesFiles=['makabe.html','kurose.html','sakaki.html','kansoku.html'];
const styleBlock='<!-- READING_STATUS_STYLES_START -->\n<link rel="stylesheet" href="/kyokai-yawa/data/reading-status.css">\n<!-- READING_STATUS_STYLES_END -->';
const scriptBlock='<!-- READING_STATUS_SCRIPT_START -->\n<script src="/kyokai-yawa/data/reading-status.js" defer></script>\n<!-- READING_STATUS_SCRIPT_END -->';
const stylePattern=/\s*<!-- READING_STATUS_STYLES_START -->[\s\S]*?<!-- READING_STATUS_STYLES_END -->\s*/g;
const scriptPattern=/\s*<!-- READING_STATUS_SCRIPT_START -->[\s\S]*?<!-- READING_STATUS_SCRIPT_END -->\s*/g;

const normalize=(filePath,{storyId='',beforeScript=''})=>{
  const original=fs.readFileSync(filePath,'utf8');
  let html=original.replace(stylePattern,'\n').replace(scriptPattern,'\n');
  if(storyId){
    html=html.replace(/<body(?:\s+data-story-id="[^"]*")?>/,`<body data-story-id="${storyId}">`);
    if(!html.includes(`data-story-id="${storyId}"`))throw new Error(`${storyId}: bodyへ作品IDを設定できません`);
  }
  if(!html.includes('</head>'))throw new Error(`${filePath}: </head>がありません`);
  html=html.replace('</head>',`${styleBlock}\n</head>`);
  if(beforeScript&&html.includes(beforeScript))html=html.replace(beforeScript,`${scriptBlock}\n${beforeScript}`);
  else if(html.includes('<!-- SW_REGISTER_START -->'))html=html.replace('<!-- SW_REGISTER_START -->',`${scriptBlock}\n<!-- SW_REGISTER_START -->`);
  else if(html.includes('</body>'))html=html.replace('</body>',`${scriptBlock}\n</body>`);
  else throw new Error(`${filePath}: 読了管理JavaScriptを挿入できません`);
  if(html!==original)fs.writeFileSync(filePath,html);
  return html!==original;
};

let changed=0;
changed+=normalize(path.join(root,'index.html'),{beforeScript:'<script src="/kyokai-yawa/data/archive-tools.js"></script>'})?1:0;
for(const file of seriesFiles)changed+=normalize(path.join(root,'series',file),{beforeScript:'<script src="/kyokai-yawa/data/series-archive-tools.js" defer></script>'})?1:0;
for(const work of works)changed+=normalize(path.join(root,'stories',work.file),{storyId:work.id,beforeScript:'<!-- READER_SCRIPT_START -->'})?1:0;

console.log(`# 読了済み管理正規化\n\n- 対象ページ: ${1+seriesFiles.length+works.length}\n- 作品ページID: ${works.length}\n- 更新ページ: ${changed}\n- 保存先: ブラウザー端末内localStorage\n`);