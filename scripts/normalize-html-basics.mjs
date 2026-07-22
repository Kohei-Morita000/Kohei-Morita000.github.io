import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const worksPath = path.join(root, 'data', 'works.js');
const indexPath = path.join(root, 'index.html');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const changes = [];

let indexHtml = fs.readFileSync(indexPath, 'utf8');
const indexBefore = indexHtml;
const fallbackAnchors = '<div class="series-anchor-fallbacks" aria-hidden="true"><span id="series-makabe"></span><span id="series-kurose"></span><span id="series-sakaki"></span><span id="series-kansoku"></span></div>';

if (!indexHtml.includes('class="series-anchor-fallbacks"')) {
  const target = '<div class="series-grid" id="series-grid"></div>';
  if (!indexHtml.includes(target)) throw new Error('index.html: series-gridが見つかりません');
  indexHtml = indexHtml.replace(target, `${fallbackAnchors}${target}`);
}

if (!indexHtml.includes('.series-anchor-fallbacks{')) {
  indexHtml = indexHtml.replace('</style>', '.series-anchor-fallbacks{height:0;overflow:hidden;position:relative}</style>');
}

if (!indexHtml.includes("document.querySelector('.series-anchor-fallbacks')?.remove();")) {
  const seriesRenderPattern = /(document\.getElementById\('series-grid'\)\.innerHTML=[^\n]*?\.join\(''\);)/;
  if (!seriesRenderPattern.test(indexHtml)) throw new Error('index.html: シリーズ描画処理が見つかりません');
  indexHtml = indexHtml.replace(seriesRenderPattern, `$1\ndocument.querySelector('.series-anchor-fallbacks')?.remove();`);
}

if (indexHtml !== indexBefore) {
  fs.writeFileSync(indexPath, indexHtml);
  changes.push('index.html: JavaScript無効時のシリーズアンカーを追加');
}

for (const work of works) {
  const filePath = path.join(root, 'stories', work.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;

  const hasSkip = /<a\b[^>]*(?:class=["'][^"']*skip[^"']*["'][^>]*href=["']#story["']|href=["']#story["'][^>]*class=["'][^"']*skip[^"']*["'])/i.test(html);
  if (!hasSkip) {
    html = html.replace(/<body>/i, '<body><a class="skip" href="#story">本文へ移動</a>');
  }

  if (!html.includes('.skip{')) {
    html = html.replace('</style>', '.skip{position:absolute;left:16px;top:-80px;background:var(--ink);color:#111;padding:10px 14px;z-index:10}.skip:focus{top:16px}</style>');
  }

  const articlePattern = /<article\b([^>]*)>/i;
  const articleMatch = html.match(articlePattern);
  if (!articleMatch) throw new Error(`${work.id}: articleが見つかりません`);
  let attributes = articleMatch[1];
  if (!/\bid=["']story["']/i.test(attributes)) attributes += ' id="story"';
  if (!/\btabindex=["']-1["']/i.test(attributes)) attributes += ' tabindex="-1"';
  html = html.replace(articlePattern, `<article${attributes}>`);

  if (html !== before) {
    fs.writeFileSync(filePath, html);
    changes.push(`${work.id}: スキップリンクまたは本文フォーカスを補正`);
  }
}

console.log([
  '# HTML基礎正規化',
  '',
  `- 対象作品: ${works.length}話`,
  `- 変更: ${changes.length}件`,
  '',
  ...(changes.length ? changes.map(change => `- ${change}`) : ['- 変更なし']),
].join('\n'));
