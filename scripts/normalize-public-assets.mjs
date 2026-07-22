import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const indexPath=path.join(root,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
const before=html;

html=html.replaceAll('/kyokai-yawa/data/works-skk011.js','/kyokai-yawa/data/archive-tools.js');

if(!html.includes('/kyokai-yawa/data/archive-tools.js')){
  throw new Error('index.htmlへarchive-tools.jsを設定できませんでした');
}
if(html.includes('/kyokai-yawa/data/works-skk011.js')){
  throw new Error('旧works-skk011.js参照が残っています');
}

if(html!==before)fs.writeFileSync(indexPath,html);
console.log(`# 公開資産参照の正規化\n\n- index.html: ${html===before?'変更なし':'archive-tools.jsへ改名反映'}\n`);
