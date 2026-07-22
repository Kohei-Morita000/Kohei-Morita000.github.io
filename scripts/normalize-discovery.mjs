import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const base = 'https://allsunday1122.github.io/kyokai-yawa/';
const indexPath = path.join(root, 'index.html');
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const escapeXml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const entries = works.map((work, index) => {
  const filePath = path.join(root, 'stories', work.file);
  const html = fs.readFileSync(filePath, 'utf8');
  const jsonText = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i)?.[1] || '{}';
  const json = JSON.parse(jsonText);
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

let indexHtml = fs.readFileSync(indexPath, 'utf8');
const graphScript = `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
const jsonPattern = /<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i;
if (!jsonPattern.test(indexHtml)) throw new Error('index.html: JSON-LDが見つかりません');
indexHtml = indexHtml.replace(jsonPattern, graphScript);

const feedLink = `<link rel="alternate" type="application/rss+xml" title="境界夜話 新着作品" href="${base}feed.xml">`;
if (!indexHtml.includes('type="application/rss+xml"')) {
  indexHtml = indexHtml.replace('</head>', `${feedLink}\n</head>`);
}
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

console.log(`# 検索・フィード正規化\n\n- 構造化作品一覧: ${entries.length}話\n- RSS項目: ${sorted.length}話\n- index.htmlへRSSリンクを追加\n`);