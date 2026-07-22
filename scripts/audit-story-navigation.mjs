import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const errors = [];
const rows = [];

const seriesPages = {
  '真壁夜話': 'makabe.html',
  '黒瀬蒐集録': 'kurose.html',
  '榊家異聞': 'sakaki.html',
  '境界観測記': 'kansoku.html',
};
const storyHref = work => `/kyokai-yawa/stories/${encodeURIComponent(work.file).replace(/%2F/gi, '/')}`;

for (const work of works) {
  const filePath = path.join(root, 'stories', work.file);
  if (!fs.existsSync(filePath)) {
    errors.push(`${work.id}: ファイルが存在しません`);
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const worksCount = (html.match(/<script src="\/kyokai-yawa\/data\/works\.js"><\/script>/g) || []).length;
  const navCount = (html.match(/<script src="\/kyokai-yawa\/data\/story-nav\.js"><\/script>/g) || []).length;
  const footerMatches = [...html.matchAll(/<nav class="footer-nav"[^>]*>([\s\S]*?)<\/nav>/gi)];
  if (worksCount !== 1) errors.push(`${work.id}: works.js読み込みが${worksCount}件です`);
  if (navCount !== 1) errors.push(`${work.id}: story-nav.js読み込みが${navCount}件です`);
  if (footerMatches.length !== 1) errors.push(`${work.id}: footer-navが${footerMatches.length}件です`);

  const group = works.filter(item => item.series === work.series);
  const index = group.findIndex(item => item.id === work.id);
  const previous = index > 0 ? group[index - 1] : null;
  const next = index >= 0 && index < group.length - 1 ? group[index + 1] : null;
  const seriesPage = seriesPages[work.series];
  const expectedHrefs = [
    previous ? storyHref(previous) : null,
    seriesPage ? `/kyokai-yawa/series/${seriesPage}` : null,
    next ? storyHref(next) : null,
  ].filter(Boolean);

  const footerHtml = footerMatches[0]?.[1] || '';
  const actualHrefs = [...footerHtml.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  if (actualHrefs.length !== expectedHrefs.length || actualHrefs.some((href, position) => href !== expectedHrefs[position])) {
    errors.push(`${work.id}: 静的導線不一致（期待 ${expectedHrefs.join('／')}、実際 ${actualHrefs.join('／') || 'なし'}）`);
  }

  const disabledCount = (footerHtml.match(/aria-disabled="true"/g) || []).length;
  const expectedDisabled = Number(!previous) + Number(!next);
  if (disabledCount !== expectedDisabled) {
    errors.push(`${work.id}: 無効方向表示が${disabledCount}件、期待${expectedDisabled}件です`);
  }

  rows.push({
    id: work.id,
    series: work.series,
    previous: previous?.id || '第1話',
    next: next?.id || '最終話',
    seriesPage: seriesPage || '未定義',
    staticLinks: actualHrefs.length,
  });
}

const navScript = path.join(root, 'data', 'story-nav.js');
if (!fs.existsSync(navScript)) errors.push('data/story-nav.jsが存在しません');
for (const page of Object.values(seriesPages)) {
  if (!fs.existsSync(path.join(root, 'series', page))) errors.push(`series/${page}が存在しません`);
}

const report = [
  '# 境界夜話 作品ページ導線監査',
  '',
  `- 対象: ${works.length}話`,
  `- 専用シリーズページ: ${Object.keys(seriesPages).length}ページ`,
  `- エラー: ${errors.length}`,
  '- 静的HTML: 同一シリーズ内の前話／専用シリーズページ／次話',
  '- JavaScript: 静的導線の表示を強化',
  '',
  '## エラー',
  '',
  ...(errors.length ? errors.map(error => `- ${error}`) : ['- なし']),
  '',
  '## 前後関係',
  '',
  '| ID | シリーズ | 前 | 次 | シリーズページ | 静的リンク数 |',
  '|---|---|---|---|---|---:|',
  ...rows.map(row => `| ${row.id} | ${row.series} | ${row.previous} | ${row.next} | ${row.seriesPage} | ${row.staticLinks} |`),
  '',
].join('\n');

fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'story-navigation-audit.md'), report);
console.log(report);
if (errors.length) process.exitCode = 1;
