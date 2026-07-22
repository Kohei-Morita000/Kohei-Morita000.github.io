import fs from 'node:fs';
import path from 'node:path';

const file=path.join(process.cwd(),'service-worker.js');
const original=fs.readFileSync(file,'utf8');
let source=original.replace(/const VERSION = 'kyokai-yawa-v\d+';/,"const VERSION = 'kyokai-yawa-v8';");
for(const asset of ['data/saved-stories.css','data/saved-stories.js']){
  const line=`  \`${'${SCOPE}'}${asset}\`,`;
  if(source.includes(asset))continue;
  const anchor='  `${SCOPE}data/reading-status.js`,\n';
  if(!source.includes(anchor))throw new Error('Service Workerの読了管理資産位置が見つかりません');
  source=source.replace(anchor,`${anchor}${line}\n`);
}
fs.writeFileSync(file,source);
console.log(`# あとで読むオフライン資産\n\n- キャッシュ世代: kyokai-yawa-v8\n- 追加資産: saved-stories.css / saved-stories.js\n- 更新: ${source===original?'なし':'あり'}\n`);