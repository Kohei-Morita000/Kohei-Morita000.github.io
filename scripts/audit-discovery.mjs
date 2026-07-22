import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const base = 'https://allsunday1122.github.io/kyokai-yawa/';
const socialImage = `${base}assets/social-card.png`;
const errors = [];
const warnings = [];
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const seriesInfo = context.window.KYOKAI_SERIES || {};
const seriesPages = {
  '真壁夜話': 'makabe.html',
  '黒瀬蒐集録': 'kurose.html',
  '榊家異聞': 'sakaki.html',
  '境界観測記': 'kansoku.html',
};
const expectedUrls = new Set(works.map(work => `${base}stories/${work.file}`));
const expectedPaths = new Set(works.map(work => `/kyokai-yawa/stories/${work.file}`));
const expectedSeriesUrls = new Set(Object.values(seriesPages).map(file => `${base}series/${file}`));
const expectedSeriesPaths = new Set(Object.values(seriesPages).map(file => `/kyokai-yawa/series/${file}`));

const required = ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'feed.xml', 'assets/social-card.svg', 'assets/social-card.png', 'data/series-pages.css'];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`${file}が存在しません`);
}
for (const file of Object.values(seriesPages)) {
  if (!fs.existsSync(path.join(root, 'series', file))) errors.push(`series/${file}が存在しません`);
}

const indexHtml = fs.existsSync(path.join(root, 'index.html')) ? fs.readFileSync(path.join(root, 'index.html'), 'utf8') : '';
const graphText = indexHtml.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i)?.[1] || '';
let graph = null;
try { graph = JSON.parse(graphText); } catch (error) { errors.push(`index.htmlのJSON-LDが不正です（${error.message}）`); }
if (graph) {
  const nodes = Array.isArray(graph['@graph']) ? graph['@graph'] : [graph];
  const website = nodes.find(node => node['@type'] === 'WebSite');
  const collection = nodes.find(node => node['@type'] === 'CollectionPage');
  const list = nodes.find(node => node['@type'] === 'ItemList');
  if (!website) errors.push('index.html: WebSite構造化データがありません');
  if (!collection) errors.push('index.html: CollectionPage構造化データがありません');
  if (!list) errors.push('index.html: ItemList構造化データがありません');
  if (collection?.primaryImageOfPage?.url !== socialImage) errors.push('CollectionPageのprimaryImageOfPageが不正です');
  if (list) {
    const items = Array.isArray(list.itemListElement) ? list.itemListElement : [];
    if (list.numberOfItems !== works.length) errors.push(`ItemList numberOfItemsが${works.length}ではありません`);
    if (items.length !== works.length) errors.push(`ItemList項目が${works.length}件ではありません`);
    const urls = new Set(items.map(item => item.url));
    for (const url of expectedUrls) if (!urls.has(url)) errors.push(`ItemListに${url}がありません`);
  }
}
if (!indexHtml.includes('type="application/rss+xml"') || !indexHtml.includes(`${base}feed.xml`)) {
  errors.push('index.htmlにRSS alternateリンクがありません');
}

const staticWorks = indexHtml.match(/<!-- STATIC_WORKS_START -->([\s\S]*?)<!-- STATIC_WORKS_END -->/)?.[1] || '';
const staticStoryPaths = new Set([...staticWorks.matchAll(/href=["'](\/kyokai-yawa\/stories\/[^"']+)["']/g)].map(match => match[1]));
if (!staticWorks) errors.push('index.htmlに静的作品一覧がありません');
if (staticStoryPaths.size !== works.length) errors.push(`静的作品リンクが${works.length}件ではありません（${staticStoryPaths.size}件）`);
for (const storyPath of expectedPaths) if (!staticStoryPaths.has(storyPath)) errors.push(`静的作品一覧に${storyPath}がありません`);

const staticSeries = indexHtml.match(/<!-- STATIC_SERIES_START -->([\s\S]*?)<!-- STATIC_SERIES_END -->/)?.[1] || '';
if (!staticSeries) errors.push('index.htmlに静的シリーズ一覧がありません');
for (const [name, info] of Object.entries(seriesInfo)) {
  if (!new RegExp(`id=["']${info.anchor}["']`).test(staticSeries)) errors.push(`静的シリーズ一覧に#${info.anchor}がありません`);
  const page = seriesPages[name];
  if (!page || !staticSeries.includes(`/kyokai-yawa/series/${page}`)) errors.push(`静的シリーズ一覧に${name}の専用ページリンクがありません`);
}
if (/JavaScriptを有効にしてください。<\/noscript>/.test(indexHtml)) warnings.push('noscriptが作品自体を閲覧できない表現になっています');

if (fs.existsSync(path.join(root, '404.html'))) {
  const html404 = fs.readFileSync(path.join(root, '404.html'), 'utf8');
  if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html404)) errors.push('404.htmlにnoindexがありません');
  if (!html404.includes('href="/kyokai-yawa/"')) errors.push('404.htmlにトップへ戻るリンクがありません');
  if (!/<title>[^<]*境界夜話[^<]*<\/title>/i.test(html404)) errors.push('404.htmlのtitleにサイト名がありません');
}

if (fs.existsSync(path.join(root, 'robots.txt'))) {
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  if (!/User-agent:\s*\*/i.test(robots)) errors.push('robots.txtにUser-agent: *がありません');
  if (!/Allow:\s*\//i.test(robots)) errors.push('robots.txtにAllow: /がありません');
  if (!robots.includes(`Sitemap: ${base}sitemap.xml`)) errors.push('robots.txtのSitemap URLが不正です');
}

let sitemapUrls = [];
if (fs.existsSync(path.join(root, 'sitemap.xml'))) {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const expectedCount = works.length + expectedSeriesUrls.size + 1;
  if (sitemapUrls.length !== expectedCount) errors.push(`sitemap URL数が${expectedCount}件ではありません（${sitemapUrls.length}件）`);
  if (!sitemapUrls.includes(base)) errors.push('sitemapにトップURLがありません');
  for (const url of expectedUrls) if (!sitemapUrls.includes(url)) errors.push(`sitemapに${url}がありません`);
  for (const url of expectedSeriesUrls) if (!sitemapUrls.includes(url)) errors.push(`sitemapに${url}がありません`);
}

let feedItems = [];
if (fs.existsSync(path.join(root, 'feed.xml'))) {
  const feed = fs.readFileSync(path.join(root, 'feed.xml'), 'utf8');
  if (!feed.includes('<rss version="2.0"')) errors.push('feed.xmlがRSS 2.0ではありません');
  if (!feed.includes(`<atom:link href="${base}feed.xml" rel="self"`)) errors.push('feed.xmlにselfリンクがありません');
  feedItems = [...feed.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)].map(match => match[1]);
  if (feedItems.length !== works.length) errors.push(`RSS項目が${works.length}件ではありません（${feedItems.length}件）`);
  for (const url of expectedUrls) if (!feedItems.includes(url)) errors.push(`RSSに${url}がありません`);
}

const publicPages = [
  { id: 'index.html', html: indexHtml },
  ...works.map(work => ({ id: work.id, html: fs.readFileSync(path.join(root, 'stories', work.file), 'utf8') })),
  ...Object.entries(seriesPages).map(([name, file]) => ({ id: name, html: fs.readFileSync(path.join(root, 'series', file), 'utf8') })),
];
for (const page of publicPages) {
  const ogImage = page.html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  const twitterImage = page.html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  const twitterCard = page.html.match(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  if (ogImage !== socialImage) errors.push(`${page.id}: og:imageが不正です`);
  if (twitterImage !== socialImage) errors.push(`${page.id}: twitter:imageが不正です`);
  if (twitterCard !== 'summary_large_image') errors.push(`${page.id}: twitter:cardがsummary_large_imageではありません`);
  if (!/<meta\s+property=["']og:image:width["']\s+content=["']1200["']/i.test(page.html)) errors.push(`${page.id}: og:image:widthがありません`);
  if (!/<meta\s+property=["']og:image:height["']\s+content=["']630["']/i.test(page.html)) errors.push(`${page.id}: og:image:heightがありません`);
}

if (fs.existsSync(path.join(root, 'assets', 'social-card.png'))) {
  const size = fs.statSync(path.join(root, 'assets', 'social-card.png')).size;
  if (size > 1024 * 1024) warnings.push(`SNS共有画像が1MiBを超えています（${(size / 1024).toFixed(1)}KiB）`);
}

const report = [
  '# 境界夜話 検索流入・404・フィード・SNS共有監査',
  '',
  `- 公開作品: ${works.length}話`,
  `- 専用シリーズページ: ${expectedSeriesUrls.size}ページ`,
  `- 静的作品リンク: ${staticStoryPaths.size}件`,
  `- 静的シリーズ棚: ${Object.keys(seriesInfo).length}件`,
  `- sitemap URL: ${sitemapUrls.length}件`,
  `- RSS項目: ${feedItems.length}件`,
  `- SNS共有画像設定ページ: ${publicPages.length}件`,
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
].join('\n');
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'discovery-audit.md'), report);
console.log(report);
if (errors.length) process.exitCode = 1;
