import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const errors = [];
const warnings = [];
const rows = [];

const cssPath = path.join(root, 'data', 'reader-tools.css');
const jsPath = path.join(root, 'data', 'reader-tools.js');
if (!fs.existsSync(cssPath)) errors.push('data/reader-tools.cssが存在しません');
if (!fs.existsSync(jsPath)) errors.push('data/reader-tools.jsが存在しません');

const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';
const cssRequirements = [
  ['スマートフォン向けmedia query', /@media\(max-width:600px\)/],
  ['44px以上の操作領域', /min-height:44px/],
  ['本文最大幅', /max-width:43em/],
  ['大文字設定', /data-reader-size="large"/],
  ['小文字設定', /data-reader-size="small"/],
  ['reduced motion対応', /prefers-reduced-motion:reduce/],
  ['前後話リンクのタップ領域', /\.footer-nav[^}]*min-height:52px/],
];
for (const [label, pattern] of cssRequirements) if (!pattern.test(css)) errors.push(`reader-tools.css: ${label}がありません`);

const jsRequirements = [
  ['読了進捗', 'aria-valuenow'],
  ['文字サイズ保存', 'kyokai-yawa-reader-size'],
  ['位置保存', 'kyokai-yawa-reader-position'],
  ['再開ボタン', 'reader-resume-button'],
  ['本文先頭リンク', 'reader-return-top'],
  ['スクロール負荷抑制', 'requestAnimationFrame'],
];
for (const [label, token] of jsRequirements) if (!js.includes(token)) errors.push(`reader-tools.js: ${label}の実装がありません`);

for (const work of works) {
  const file = path.join(root, 'stories', work.file);
  if (!fs.existsSync(file)) {
    errors.push(`${work.id}: HTMLが存在しません`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const styleCount = [...html.matchAll(/href=["']\/kyokai-yawa\/data\/reader-tools\.css["']/g)].length;
  const scriptCount = [...html.matchAll(/src=["']\/kyokai-yawa\/data\/reader-tools\.js["']/g)].length;
  const paragraphs = [...html.matchAll(/<article\b[^>]*id=["']story["'][^>]*>([\s\S]*?)<\/article>/gi)][0]?.[1]?.match(/<p\b/gi)?.length || 0;
  const navLinks = [...html.matchAll(/<nav\b[^>]*class=["'][^"']*footer-nav[^"']*["'][^>]*>([\s\S]*?)<\/nav>/gi)][0]?.[1]?.match(/<a\b/gi)?.length || 0;

  if (styleCount !== 1) errors.push(`${work.id}: reader-tools.css参照が1件ではありません（${styleCount}件）`);
  if (scriptCount !== 1) errors.push(`${work.id}: reader-tools.js参照が1件ではありません（${scriptCount}件）`);
  if (!/<meta\s+name=["']viewport["']/i.test(html)) errors.push(`${work.id}: viewport設定がありません`);
  if (!/<article\b[^>]*id=["']story["']/i.test(html)) errors.push(`${work.id}: article#storyがありません`);
  if (!/<div\b[^>]*class=["'][^"']*meta[^"']*["']/i.test(html)) errors.push(`${work.id}: 作品情報meta領域がありません`);
  if (!/<nav\b[^>]*class=["'][^"']*footer-nav[^"']*["']/i.test(html)) errors.push(`${work.id}: 前後話ナビゲーションがありません`);
  if (paragraphs < 10) warnings.push(`${work.id}: 本文段落が少なめです（${paragraphs}段落）`);
  if (navLinks < 1) warnings.push(`${work.id}: クリック可能な前後話リンクがありません`);
  rows.push({ id: work.id, paragraphs, navLinks, styleCount, scriptCount });
}

const paragraphValues = rows.map(row => row.paragraphs);
const minParagraphs = paragraphValues.length ? Math.min(...paragraphValues) : 0;
const maxParagraphs = paragraphValues.length ? Math.max(...paragraphValues) : 0;
const averageParagraphs = paragraphValues.length ? paragraphValues.reduce((a, b) => a + b, 0) / paragraphValues.length : 0;

const report = [
  '# 境界夜話 スマートフォン読書体験監査',
  '',
  `- 対象: ${works.length}話`,
  '- 本文基準: スマートフォン1.04rem・行間2.05、読者設定で小／標準／大',
  '- 読了進捗: article#story範囲を0〜100%で表示',
  '- 再訪支援: 3〜97%の範囲だけ位置を保存し、任意操作で復帰',
  '- 長文支援: 本文先頭リンク、最大43em、reduced-motion対応',
  `- 段落数: 最小${minParagraphs}／平均${averageParagraphs.toFixed(1)}／最大${maxParagraphs}`,
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  '',
  '## エラー',
  '',
  ...(errors.length ? errors.map(error => `- ${error}`) : ['- なし']),
  '',
  '## 警告',
  '',
  ...(warnings.length ? warnings.map(warning => `- ${warning}`) : ['- なし']),
  '',
  '## 作品別確認',
  '',
  '| ID | 本文段落 | 前後話リンク | CSS | JS |',
  '|---|---:|---:|---:|---:|',
  ...rows.map(row => `| ${row.id} | ${row.paragraphs} | ${row.navLinks} | ${row.styleCount} | ${row.scriptCount} |`),
  '',
].join('\n');

fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'reader-experience-audit.md'), report);
console.log(report);
if (errors.length) process.exitCode = 1;
