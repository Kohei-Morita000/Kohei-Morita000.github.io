import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const worksTag = '<script src="/kyokai-yawa/data/works.js"></script>';
const navTag = '<script src="/kyokai-yawa/data/story-nav.js"></script>';
const changed = [];

const seriesPages = {
  '真壁夜話': 'makabe.html',
  '黒瀬蒐集録': 'kurose.html',
  '榊家異聞': 'sakaki.html',
  '境界観測記': 'kansoku.html',
};

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const storyHref = work => `/kyokai-yawa/stories/${encodeURIComponent(work.file).replace(/%2F/gi, '/')}`;

for (const work of works) {
  const filePath = path.join(root, 'stories', work.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;
  const group = works.filter(item => item.series === work.series);
  const index = group.findIndex(item => item.id === work.id);
  if (index < 0) throw new Error(`${work.id}: シリーズ内の位置を取得できません`);

  const previous = group[index - 1];
  const next = group[index + 1];
  const seriesPage = seriesPages[work.series];
  if (!seriesPage) throw new Error(`${work.id}: シリーズページが未定義です`);

  const previousHtml = previous
    ? `<a class="story-nav-link previous" href="${storyHref(previous)}"><span>前の話</span><strong>${escapeHtml(previous.title)}</strong></a>`
    : '<span class="story-nav-link disabled" aria-disabled="true"><span>前の話</span><strong>シリーズ第1話</strong></span>';
  const seriesHtml = `<a class="story-nav-link series-index" href="/kyokai-yawa/series/${seriesPage}"><span>シリーズ一覧</span><strong>${escapeHtml(work.series)}</strong></a>`;
  const nextHtml = next
    ? `<a class="story-nav-link next" href="${storyHref(next)}"><span>次の話</span><strong>${escapeHtml(next.title)}</strong></a>`
    : '<span class="story-nav-link disabled" aria-disabled="true"><span>次の話</span><strong>シリーズ最終話</strong></span>';
  const footer = `<nav class="footer-nav" aria-label="${escapeHtml(work.series)}の前後話">${previousHtml}${seriesHtml}${nextHtml}</nav>`;

  const footerPattern = /<nav class="footer-nav"[\s\S]*?<\/nav>/i;
  if (!footerPattern.test(html)) throw new Error(`${work.id}: footer-navが見つかりません`);
  html = html.replace(footerPattern, footer);

  html = html
    .replace(/\s*<script src="\/kyokai-yawa\/data\/works\.js"><\/script>/g, '')
    .replace(/\s*<script src="\/kyokai-yawa\/data\/story-nav\.js"><\/script>/g, '');
  html = html.replace(/<\/body>/i, `${worksTag}${navTag}</body>`);

  if (html !== before) {
    fs.writeFileSync(filePath, html);
    changed.push(work.id);
  }
}

console.log([
  '# 作品ページ導線正規化',
  '',
  `- 対象: ${works.length}話`,
  `- 更新: ${changed.length}話`,
  '- 静的HTML: 前の話／専用シリーズページ／次の話',
  '- JavaScript: 同じ導線を表示強化',
  '',
  ...(changed.length ? changed.map(id => `- ${id}`) : ['- 変更なし']),
].join('\n'));
