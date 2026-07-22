import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const worksPath = path.join(root, 'data', 'works.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });

const works = context.window.KYOKAI_WORKS || [];
const expectedSeries = ['真壁夜話', '黒瀬蒐集録', '榊家異聞', '境界観測記'];
const charsPerMinute = 350;
const errors = [];
const warnings = [];
const rows = [];
const storyTexts = [];

const decodeEntities = value => value
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const stripTags = value => decodeEntities(value
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<[^>]+>/g, ''));

const extractArticleHtml = html => html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? null;

const cleanArticle = html => {
  const articleHtml = extractArticleHtml(html);
  if (articleHtml === null) return null;
  return stripTags(articleHtml).replace(/[\s\u3000]+/g, '');
};

const extractParagraphs = html => {
  const articleHtml = extractArticleHtml(html);
  if (articleHtml === null) return [];
  return [...articleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => stripTags(match[1]).replace(/[\s\u3000]+/g, ' ').trim())
    .filter(Boolean);
};

const extractMinutes = (html, regex, label, file) => {
  const match = html.match(regex);
  if (!match) {
    errors.push(`${file}: ${label}が見つかりません`);
    return null;
  }
  return Number(match[1]);
};

const shingles = (text, size = 5) => {
  const normalized = text.replace(/[\s\u3000、。・「」『』（）()：:；;！？!?\-—―…]/g, '');
  const set = new Set();
  for (let index = 0; index <= normalized.length - size; index += 1) {
    set.add(normalized.slice(index, index + size));
  }
  return set;
};

const jaccard = (left, right) => {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  const smaller = left.size <= right.size ? left : right;
  const larger = left.size <= right.size ? right : left;
  for (const item of smaller) if (larger.has(item)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
};

if (works.length !== 48) errors.push(`data/works.js: 作品数が48ではありません（${works.length}）`);

for (const series of expectedSeries) {
  const count = works.filter(work => work.series === series).length;
  if (count !== 12) errors.push(`${series}: 12話ではありません（${count}話）`);
}

const duplicateIds = works.filter((work, index) => works.findIndex(item => item.id === work.id) !== index);
const duplicateFiles = works.filter((work, index) => works.findIndex(item => item.file === work.file) !== index);
if (duplicateIds.length) errors.push(`重複作品ID: ${[...new Set(duplicateIds.map(work => work.id))].join(', ')}`);
if (duplicateFiles.length) errors.push(`重複ファイル: ${[...new Set(duplicateFiles.map(work => work.file))].join(', ')}`);

for (const work of works) {
  const filePath = path.join(root, 'stories', work.file);
  if (!fs.existsSync(filePath)) {
    errors.push(`${work.id}: stories/${work.file} が存在しません`);
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const article = cleanArticle(html);
  const paragraphs = extractParagraphs(html);
  if (article === null) {
    errors.push(`${work.id}: article要素が見つかりません`);
    continue;
  }

  const chars = Array.from(article).length;
  const estimatedMinutes = Math.max(1, Math.ceil(chars / charsPerMinute));
  const pageMinutes = extractMinutes(html, /<div class="meta"[^>]*>[\s\S]*?<span>約(\d+)分<\/span>/i, 'ページ読了時間', work.file);
  const jsonMinutes = extractMinutes(html, /"timeRequired"\s*:\s*"PT(\d+)M"/i, 'JSON-LD読了時間', work.file);
  const listMatch = String(work.mins || '').match(/約(\d+)分/);
  const listMinutes = listMatch ? Number(listMatch[1]) : null;
  if (listMinutes === null) errors.push(`${work.id}: data/works.jsの読了時間形式が不正です（${work.mins}）`);

  const values = [pageMinutes, jsonMinutes, listMinutes].filter(Number.isFinite);
  if (values.length === 3 && new Set(values).size !== 1) {
    errors.push(`${work.id}: 読了時間が不一致（ページ${pageMinutes}分／JSON-LD${jsonMinutes}分／一覧${listMinutes}分）`);
  }

  if (Number.isFinite(pageMinutes) && Math.abs(pageMinutes - estimatedMinutes) > 1) {
    warnings.push(`${work.id}: 表示${pageMinutes}分、${charsPerMinute}字/分基準では約${estimatedMinutes}分（本文${chars.toLocaleString('ja-JP')}字）`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || '';
  const expectedCanonical = `https://allsunday1122.github.io/kyokai-yawa/stories/${work.file}`;
  if (canonical !== expectedCanonical) errors.push(`${work.id}: canonical不一致（${canonical || 'なし'}）`);

  rows.push({
    id: work.id,
    series: work.series,
    title: work.title,
    chars,
    displayed: pageMinutes,
    estimated: estimatedMinutes,
    delta: Number.isFinite(pageMinutes) ? pageMinutes - estimatedMinutes : null,
  });

  storyTexts.push({
    id: work.id,
    series: work.series,
    title: work.title,
    text: article,
    paragraphs,
    opening: paragraphs[0] || '',
    ending: paragraphs.at(-1) || '',
    shingles: shingles(article),
  });
}

const repeatedOpenings = [];
const repeatedEndings = [];
const repeatedParagraphs = [];
const collectExactRepeats = (selector, destination, minimumLength = 12) => {
  const occurrences = new Map();
  for (const story of storyTexts) {
    const values = selector(story);
    for (const raw of Array.isArray(values) ? values : [values]) {
      const value = String(raw || '').trim();
      if (Array.from(value).length < minimumLength) continue;
      const list = occurrences.get(value) || [];
      list.push(story.id);
      occurrences.set(value, list);
    }
  }
  for (const [text, ids] of occurrences) {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length >= 2) destination.push({ text, ids: uniqueIds });
  }
};

collectExactRepeats(story => story.opening, repeatedOpenings, 8);
collectExactRepeats(story => story.ending, repeatedEndings, 8);
collectExactRepeats(story => story.paragraphs, repeatedParagraphs, 16);

const similarityPairs = [];
for (let leftIndex = 0; leftIndex < storyTexts.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < storyTexts.length; rightIndex += 1) {
    const left = storyTexts[leftIndex];
    const right = storyTexts[rightIndex];
    const score = jaccard(left.shingles, right.shingles);
    similarityPairs.push({ left, right, score });
  }
}
similarityPairs.sort((a, b) => b.score - a.score);
const highSimilarityPairs = similarityPairs.filter(pair => pair.score >= 0.12).slice(0, 20);

const formatRepeat = item => `- ${item.ids.join('／')}: 「${item.text.slice(0, 80)}${item.text.length > 80 ? '…' : ''}」`;
const formatSimilarity = pair => `- ${pair.left.id}「${pair.left.title}」 ↔ ${pair.right.id}「${pair.right.title}」: ${(pair.score * 100).toFixed(1)}%`;

const report = [
  '# 境界夜話 コンテンツ監査レポート',
  '',
  `- 作品数: ${works.length}`,
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  `- 読了時間推定基準: 本文${charsPerMinute}文字／分、端数切り上げ`,
  `- 類似度基準: 本文の5文字連続列によるJaccard係数`,
  '',
  '## シリーズ別作品数',
  '',
  ...expectedSeries.map(series => `- ${series}: ${works.filter(work => work.series === series).length}話`),
  '',
  '## エラー',
  '',
  ...(errors.length ? errors.map(item => `- ${item}`) : ['- なし']),
  '',
  '## 読了時間の警告',
  '',
  ...(warnings.length ? warnings.map(item => `- ${item}`) : ['- なし']),
  '',
  '## 完全一致する冒頭',
  '',
  ...(repeatedOpenings.length ? repeatedOpenings.map(formatRepeat) : ['- なし']),
  '',
  '## 完全一致する末尾',
  '',
  ...(repeatedEndings.length ? repeatedEndings.map(formatRepeat) : ['- なし']),
  '',
  '## 複数作品で完全一致する段落',
  '',
  ...(repeatedParagraphs.length ? repeatedParagraphs.slice(0, 50).map(formatRepeat) : ['- なし']),
  '',
  '## 本文類似度が高い作品ペア',
  '',
  ...(highSimilarityPairs.length ? highSimilarityPairs.map(formatSimilarity) : ['- 12%以上のペアなし']),
  '',
  '## 作品別一覧',
  '',
  `| ID | シリーズ | 作品名 | 本文文字数 | 表示 | ${charsPerMinute}字/分推定 | 差 |`,
  '|---|---|---|---:|---:|---:|---:|',
  ...rows.map(row => `| ${row.id} | ${row.series} | ${row.title.replace(/\|/g, '｜')} | ${row.chars.toLocaleString('ja-JP')} | ${row.displayed ?? '-'}分 | ${row.estimated}分 | ${row.delta === null ? '-' : `${row.delta > 0 ? '+' : ''}${row.delta}`} |`),
  '',
].join('\n');

fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'content-audit.md'), report);
console.log(report);

if (errors.length) process.exitCode = 1;
