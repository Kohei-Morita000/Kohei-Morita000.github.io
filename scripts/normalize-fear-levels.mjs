import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
let worksSource = fs.readFileSync(worksPath, 'utf8');
vm.runInNewContext(worksSource, context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];

const decisions = new Map([
  ['MKB-006', 4],
  ['MKB-010', 4],
  ['KRS-010', 4],
  ['SKK-011', 4],
  ['KKS-S1E02', 4],
]);

const reasons = {
  'MKB-006': '自宅全体と私物が清掃対象として消失し、生活基盤が直接侵害される',
  'MKB-010': '複数人の記憶と業務履歴が未送信文によって強制改変され、主体性を失う',
  'KRS-010': '実在世帯の住所と郵便が存在しない橋脚下へ恒久的に移り、解決していない',
  'SKK-011': '家族の認識から語り手が外れ、家へ戻れない位置に固定される',
  'KKS-S1E02': '知覚上の最後の一両を見落とし、実際に列車接触寸前まで進む直接的生命危険がある',
};

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const changes = [];

for (const work of works) {
  const target = decisions.get(work.id);
  if (!target) continue;

  const filePath = path.join(root, 'stories', work.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const pagePattern = /(<div class="meta"[^>]*>[\s\S]*?<span>恐怖レベル\s*)[1-5](<\/span>)/i;
  const pageMatch = html.match(pagePattern);
  if (!pageMatch) throw new Error(`${work.id}: ページの恐怖レベル表示が見つかりません`);
  const currentPage = Number(pageMatch[0].match(/[1-5](?=<\/span>)/)?.[0]);
  html = html.replace(pagePattern, `$1${target}$2`);
  fs.writeFileSync(filePath, html);

  const id = escapeRegExp(work.id);
  const worksPattern = new RegExp(`(\\{id:'${id}',[^\\n]*?fear:')[1-5](')`);
  const worksMatch = worksSource.match(worksPattern);
  if (!worksMatch) throw new Error(`${work.id}: data/works.jsの恐怖レベルが見つかりません`);
  const currentList = Number(worksMatch[0].match(/[1-5](?=')/)?.[0]);
  worksSource = worksSource.replace(worksPattern, `$1${target}$2`);

  if (currentPage !== target || currentList !== target) {
    changes.push(`${work.id}: ${currentList} → ${target}（${reasons[work.id]}）`);
  }
}

fs.writeFileSync(worksPath, worksSource);

console.log([
  '# 恐怖レベル編集正規化',
  '',
  '- 基準3: 不穏さ中心。直接的生命危険や恒久的な自己喪失がない',
  '- 基準4: 生命・身体・住居・家族関係・身分に直接危険が及ぶ、または未解決の侵害が残る',
  '- 基準5: 死亡可能性、人物消去、集団災害など重大かつ不可逆性の高い危険',
  `- 対象変更: ${changes.length}話`,
  '',
  ...(changes.length ? changes.map(item => `- ${item}`) : ['- 変更なし']),
].join('\n'));
