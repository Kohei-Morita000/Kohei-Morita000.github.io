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
const charsPerMinute = 350;

const decodeEntities = value => value
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const lengthForMinutes = minutes => minutes <= 7 ? '短編' : minutes <= 11 ? '中編' : '長編';

for (const work of works) {
  const filePath = path.join(root, 'stories', work.file);
  const html = fs.readFileSync(filePath, 'utf8');
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (article === undefined) {
    errors.push(`${work.id}: article要素がありません`);
    continue;
  }

  const text = decodeEntities(article
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[\s\u3000]+/g, ''));
  const chars = Array.from(text).length;
  const minutes = Math.max(1, Math.ceil(chars / charsPerMinute));
  const expected = lengthForMinutes(minutes);
  const pageLength = html.match(/<div class="meta"[^>]*>[\s\S]*?<span>(短編|中編|長編)<\/span>/i)?.[1] || '';
  const listLength = work.length || '';

  if (!pageLength) errors.push(`${work.id}: ページ長さ区分が見つかりません`);
  if (pageLength && pageLength !== expected) errors.push(`${work.id}: ページは${pageLength}、基準では${expected}`);
  if (listLength !== expected) errors.push(`${work.id}: 一覧は${listLength}、基準では${expected}`);

  rows.push({ id: work.id, title: work.title, minutes, expected, pageLength, listLength });
}

const report = [
  '# 境界夜話 長さ区分監査レポート',
  '',
  `- 対象: ${works.length}話`,
  `- エラー: ${errors.length}`,
  `- 基準: 短編7分以下／中編8〜11分／長編12分以上`,
  '',
  '## エラー',
  '',
  ...(errors.length ? errors.map(error => `- ${error}`) : ['- なし']),
  '',
  '## 作品別一覧',
  '',
  '| ID | 作品名 | 読了時間 | 基準区分 | ページ | 一覧 |',
  '|---|---|---:|---|---|---|',
  ...rows.map(row => `| ${row.id} | ${row.title.replace(/\|/g, '｜')} | ${row.minutes}分 | ${row.expected} | ${row.pageLength || '-'} | ${row.listLength || '-'} |`),
  '',
].join('\n');

fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'length-category-audit.md'), report);
console.log(report);
if (errors.length) process.exitCode = 1;
