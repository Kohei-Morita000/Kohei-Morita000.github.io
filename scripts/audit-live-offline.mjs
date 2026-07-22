import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

const root = process.cwd();
const base = 'https://allsunday1122.github.io/kyokai-yawa/';
const context = { window: {} };
const worksPath = path.join(root, 'data', 'works.js');
vm.runInNewContext(fs.readFileSync(worksPath, 'utf8'), context, { filename: worksPath });
const works = context.window.KYOKAI_WORKS || [];
const errors = [];
const warnings = [];
const rows = [];

const request = async (relative, accept = '*/*') => {
  const url = new URL(relative, base).href;
  const started = performance.now();
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'user-agent': 'KyokaiYawa-Live-Offline-Audit/1.0',
      accept,
    },
  });
  const body = await response.text();
  rows.push({ relative, status: response.status, type: response.headers.get('content-type') || '', ms: performance.now() - started });
  return { response, body };
};

const requiredAssets = [
  ['service-worker.js', 'javascript'],
  ['offline.html', 'text/html'],
  ['data/sw-register.js', 'javascript'],
  ['manifest.webmanifest', 'json'],
];
const bodies = new Map();
for (const [relative, expectedType] of requiredAssets) {
  try {
    const { response, body } = await request(relative);
    bodies.set(relative, body);
    const type = response.headers.get('content-type') || '';
    if (response.status !== 200) errors.push(`${relative}: HTTP ${response.status}`);
    if (!type.toLowerCase().includes(expectedType)) errors.push(`${relative}: Content-Type不一致（${type || 'なし'}）`);
  } catch (error) {
    errors.push(`${relative}: 取得失敗（${error.message}）`);
  }
}

const worker = bodies.get('service-worker.js') || '';
const workerChecks = [
  ["request.mode === 'navigate'", '画面遷移のnetwork-first判定'],
  ["cache: 'no-store'", '最新HTML取得設定'],
  ['OFFLINE_URL', 'オフラインフォールバック'],
  ['caches.delete(key)', '旧キャッシュ削除'],
  ['self.skipWaiting()', 'service worker即時更新'],
  ['self.clients.claim()', '制御切替'],
];
for (const [fragment, label] of workerChecks) {
  if (!worker.includes(fragment)) errors.push(`service-worker.js: ${label}が本番にありません`);
}
const precache = worker.match(/const PRECACHE = \[([\s\S]*?)\];/)?.[1] || '';
if (precache.includes('/stories/')) errors.push('service-worker.js: 全作品本文を事前キャッシュしています');

const register = bodies.get('data/sw-register.js') || '';
if (!register.includes("updateViaCache: 'none'")) errors.push('sw-register.js: service worker本体のキャッシュ回避がありません');
if (!register.includes('registration.update()')) errors.push('sw-register.js: 更新確認がありません');

const offline = bodies.get('offline.html') || '';
if (!/<meta\s+name=["']robots["'][^>]*noindex/i.test(offline)) errors.push('offline.html: noindexがありません');
if (!offline.includes('href="/kyokai-yawa/"')) errors.push('offline.html: トップ復帰リンクがありません');
if (!offline.includes('/kyokai-yawa/data/sw-register.js')) errors.push('offline.html: service worker登録scriptがありません');

const pageTargets = [
  ['TOP', ''],
  ...works.map(work => [work.id, `stories/${work.file}`]),
];
const registrationFragment = '<script src="/kyokai-yawa/data/sw-register.js" defer></script>';
for (const [id, relative] of pageTargets) {
  try {
    const { response, body } = await request(relative, 'text/html');
    if (response.status !== 200) errors.push(`${id}: HTTP ${response.status}`);
    if (!body.includes(registrationFragment)) errors.push(`${id}: service worker登録scriptが本番HTMLにありません`);
  } catch (error) {
    errors.push(`${id}: 取得失敗（${error.message}）`);
  }
}

try {
  const missing = `__offline-audit-missing-${Date.now()}.html`;
  const { response, body } = await request(missing, 'text/html');
  if (response.status !== 404) errors.push(`404: HTTP ${response.status}`);
  if (!body.includes(registrationFragment)) errors.push('404: service worker登録scriptが本番HTMLにありません');
} catch (error) {
  errors.push(`404取得失敗（${error.message}）`);
}

const report = [
  '# 境界夜話 本番Service Worker・オフライン監査',
  '',
  `- 実行日時: ${new Date().toISOString()}`,
  `- 通常HTML確認: ${pageTargets.length}ページ`,
  `- 404確認: 1ページ`,
  `- オフライン関連資産: ${requiredAssets.length}件`,
  '- オンライン表示: network-first・no-store',
  '- 通信失敗時: 閲覧済みページ、未保存時はoffline.html',
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
  '## 配信資産',
  '',
  '| 対象 | HTTP | Content-Type | 応答 |',
  '|---|---:|---|---:|',
  ...rows.slice(0, requiredAssets.length).map(row => `| ${row.relative} | ${row.status} | ${row.type.replaceAll('|', '｜')} | ${Math.round(row.ms)}ms |`),
  '',
].join('\n');

fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'live-offline-audit.md'), report);
console.log(report);
if (errors.length) process.exitCode = 1;
