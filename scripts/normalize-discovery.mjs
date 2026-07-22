import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const base = 'https://allsunday1122.github.io/kyokai-yawa/';
const socialImage = `${base}assets/social-card.png`;
const socialAlt = '境界夜話 四つの怪談アーカイブ';
const indexPath = path.join(root, 'index.html');
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const seriesInfo = context.window.KYOKAI_SERIES || {};
const escapeXml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');
const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const applySocialMeta = html => {
  html = html
    .replace(/<meta\s+property=["']og:image(?::[^"']+)?["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:image(?::[^"']+)?["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:card["']\s+content=["'][^"']*["'][^>]*>/i, '<meta name="twitter:card" content="summary_large_image">');

  const imageMeta = [
    `<meta property="og:image" content="${socialImage}">`,
    `<meta property="og:image:secure_url" content="${socialImage}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${socialAlt}">`,
    `<meta name="twitter:image" content="${socialImage}">`,
    `<meta name="twitter:image:alt" content="${socialAlt}">`,
  ].join('');

  const cardPattern = /<meta\s+name=["']twitter:card["'][^>]*>/i;
  if (!cardPattern.test(html)) throw new Error('twitter:cardが見つかりません');
  return html.replace(cardPattern, `${imageMeta}$&`);
};

const entries = works.map((work, index) => {
  const filePath = path.join(root, 'stories', work.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const jsonText = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i)?.[1] || '{}';
  const json = JSON.parse(jsonText);
  html = applySocialMeta(html);
  fs.writeFileSync(filePath, html);
  return {
    ...work,
    position: index + 1,
    url: `${base}stories/${work.file}`,
    datePublished: json.datePublished || '2026-07-22',
    dateModified: json.dateModified || json.datePublished || '2026-07-22',
    description: json.description || work.desc,
  };
});

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${base}#website`,
      name: '境界夜話',
      description: '真壁夜話・黒瀬蒐集録・榊家異聞・境界観測記を収録する連作怪談アーカイブ。',
      url: base,
      inLanguage: 'ja',
    },
    {
      '@type': 'CollectionPage',
      '@id': `${base}#collection`,
      name: '境界夜話｜四つの怪談アーカイブ',
      description: '記録、家、土地、境界に残る夜の話を集めた怪談アーカイブ。',
      url: base,
      inLanguage: 'ja',
      isPartOf: { '@id': `${base}#website` },
      mainEntity: { '@id': `${base}#stories` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: socialImage,
        width: 1200,
        height: 630,
      },
    },
    {
      '@type': 'ItemList',
      '@id': `${base}#stories`,
      name: '境界夜話 公開作品一覧',
      numberOfItems: entries.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: entries.map(entry => ({
        '@type': 'ListItem',
        position: entry.position,
        url: entry.url,
        name: `${entry.title}｜${entry.series}`,
      })),
    },
  ],
};

let indexHtml = applySocialMeta(fs.readFileSync(indexPath, 'utf8'));
const graphScript = `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
const jsonPattern = /<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i;
if (!jsonPattern.test(indexHtml)) throw new Error('index.html: JSON-LDが見つかりません');
indexHtml = indexHtml.replace(jsonPattern, graphScript);

const feedLink = `<link rel="alternate" type="application/rss+xml" title="境界夜話 新着作品" href="${base}feed.xml">`;
if (!indexHtml.includes('type="application/rss+xml"')) {
  indexHtml = indexHtml.replace('</head>', `${feedLink}\n</head>`);
}

const worksStart = '<!-- STATIC_WORKS_START -->';
const worksEnd = '<!-- STATIC_WORKS_END -->';
const staticWorks = entries.map(entry => `<a class="work-card" href="/kyokai-yawa/stories/${escapeHtml(entry.file)}"><div><span class="id">${escapeHtml(entry.id)} · ${escapeHtml(entry.series)}</span><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.desc)}</p></div><div class="work-meta"><span class="tag">${escapeHtml(entry.length)}</span><span class="tag">${escapeHtml(entry.mins)}</span><span class="tag">恐怖 ${escapeHtml(entry.fear)}</span></div></a>`).join('');
const staticWorksBlock = `${worksStart}${staticWorks}${worksEnd}`;
if (indexHtml.includes(worksStart)) {
  indexHtml = indexHtml.replace(new RegExp(`${worksStart}[\\s\\S]*?${worksEnd}`), staticWorksBlock);
} else {
  const emptyWorks = /<div class="work-grid" id="work-grid">\s*<\/div>/;
  if (!emptyWorks.test(indexHtml)) throw new Error('index.html: 静的作品一覧の挿入先が見つかりません');
  indexHtml = indexHtml.replace(emptyWorks, `<div class="work-grid" id="work-grid">${staticWorksBlock}</div>`);
}

const seriesStart = '<!-- STATIC_SERIES_START -->';
const seriesEnd = '<!-- STATIC_SERIES_END -->';
const staticSeries = Object.entries(seriesInfo).map(([name, info]) => {
  const group = entries.filter(entry => entry.series === name);
  return `<article class="series-card" id="${escapeHtml(info.anchor)}"><div class="series-card-head"><div class="series-title-row"><h3>${escapeHtml(name)}</h3><span class="series-count">${group.length}話公開</span></div><p>${escapeHtml(info.desc)}</p></div><ul class="story-list">${group.map(entry => `<li><a class="story-link" href="/kyokai-yawa/stories/${escapeHtml(entry.file)}"><span class="story-id">${escapeHtml(entry.id)}</span><span class="story-title">${escapeHtml(entry.title)}</span><span class="story-arrow">›</span></a></li>`).join('')}</ul></article>`;
}).join('');
const staticSeriesBlock = `${seriesStart}${staticSeries}${seriesEnd}`;
if (indexHtml.includes(seriesStart)) {
  indexHtml = indexHtml.replace(new RegExp(`${seriesStart}[\\s\\S]*?${seriesEnd}`), staticSeriesBlock);
} else {
  const emptySeries = /<div class="series-grid" id="series-grid">\s*<\/div>/;
  if (!emptySeries.test(indexHtml)) throw new Error('index.html: 静的シリーズ一覧の挿入先が見つかりません');
  indexHtml = indexHtml.replace(emptySeries, `<div class="series-grid" id="series-grid">${staticSeriesBlock}</div>`);
}

indexHtml = indexHtml
  .replace(/<div class="series-anchor-fallbacks"[^>]*>[\s\S]*?<\/div>/i, '')
  .replace(/<noscript>[\s\S]*?<\/noscript>/i, '<noscript>検索・絞り込み機能を使うにはJavaScriptを有効にしてください。作品リンクはそのまま利用できます。</noscript>');

fs.writeFileSync(indexPath, indexHtml);

const sorted = [...entries].sort((a, b) =>
  b.dateModified.localeCompare(a.dateModified) || b.datePublished.localeCompare(a.datePublished) || b.id.localeCompare(a.id)
);
const latestDate = sorted[0]?.dateModified || '2026-07-22';
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>境界夜話 新着作品</title>
    <link>${base}</link>
    <description>真壁夜話・黒瀬蒐集録・榊家異聞・境界観測記の公開作品フィード。</description>
    <language>ja</language>
    <lastBuildDate>${new Date(`${latestDate}T00:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${base}feed.xml" rel="self" type="application/rss+xml" />
${sorted.map(entry => `    <item>
      <title>${escapeXml(entry.title)}｜${escapeXml(entry.series)}</title>
      <link>${entry.url}</link>
      <guid isPermaLink="true">${entry.url}</guid>
      <pubDate>${new Date(`${entry.datePublished}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(entry.description)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(root, 'feed.xml'), rss);

console.log(`# 検索・フィード・SNS共有正規化\n\n- 構造化作品一覧: ${entries.length}話\n- 静的作品リンク: ${entries.length}話\n- 静的シリーズ棚: ${Object.keys(seriesInfo).length}件\n- RSS項目: ${sorted.length}話\n- OGP・X共有画像: トップ＋${entries.length}話\n`);
