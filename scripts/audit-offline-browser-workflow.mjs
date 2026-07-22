import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const warnings=[];
const read=file=>fs.existsSync(path.join(root,file))?fs.readFileSync(path.join(root,file),'utf8'):'';

const workflow=read('.github/workflows/offline-public-browser-audit.yml');
const config=read('playwright.offline.config.mjs');
const tests=read('tests/offline-pwa.spec.mjs');
const reporter=read('scripts/offline-browser-reporter.mjs');
const worker=read('service-worker.js');
const offline=read('offline.html');
const manifest=read('manifest.webmanifest');

for(const [file,content] of [
  ['.github/workflows/offline-public-browser-audit.yml',workflow],
  ['playwright.offline.config.mjs',config],
  ['tests/offline-pwa.spec.mjs',tests],
  ['scripts/offline-browser-reporter.mjs',reporter],
  ['service-worker.js',worker],
  ['offline.html',offline],
  ['manifest.webmanifest',manifest],
])if(!content)errors.push(`${file}が存在しないか空です`);

for(const token of [
  "cron: '0 22 * * *'",
  'Public Reading Browser Audit',
  'timeout-minutes: 20',
  'contents: write',
  'playwright.offline.config.mjs',
  '--with-deps chromium webkit',
  'offline-public-browser-audit.md',
  'retention-days: 14',
  'continue-on-error: true',
])if(!workflow.includes(token))errors.push(`オフライン監査workflowに必要設定がありません: ${token}`);

for(const token of [
  "serviceWorkers:'allow'",
  "name:'chromium-desktop'",
  "name:'webkit-mobile'",
  "baseURL=process.env.OFFLINE_BASE_URL",
  "testMatch:'offline-pwa.spec.mjs'",
])if(!config.includes(token))errors.push(`Playwrightオフライン設定に必要定義がありません: ${token}`);

for(const token of [
  'navigator.serviceWorker.ready',
  'context.setOffline(true)',
  'cachedText',
  "testInfo.project.name==='webkit-mobile'",
  'caches.match',
  'manifest.webmanifest',
  'app-icon-192.png',
  'article#story',
  '通信できません',
  'reading-log.html',
  'toHaveCount(48)',
])if(!tests.includes(token))errors.push(`オフライン実ブラウザー試験に必要ケースがありません: ${token}`);

for(const token of [
  'offline-public-browser-audit.md',
  'chromium-desktop',
  'webkit-mobile',
  '閲覧済み作品再読',
  'Chromiumは実際のオフライン画面遷移',
  'WebKitはPlaywright内部エラー回避',
])if(!reporter.includes(token))errors.push(`オフライン監査reporterに必要定義がありません: ${token}`);

for(const token of ['OFFLINE_URL','cache.addAll(PRECACHE)',"request.mode === 'navigate'",'networkFirst(request, PAGE_CACHE, OFFLINE_URL)'])if(!worker.includes(token))errors.push(`Service Workerに必要処理がありません: ${token}`);
if(!offline.includes('通信できません')||!offline.includes('以前に開いた作品'))errors.push('offline.htmlの案内文が不足しています');
if(!manifest.includes('"start_url": "/kyokai-yawa/"'))errors.push('manifestのstart_urlが不正です');

const report=[
  '# 境界夜話 公開オフライン・PWA実ブラウザー監査 設定監査',
  '',
  '- 実行対象: GitHub Pages公開サイト',
  '- 定期実行: 毎日07:00 JST',
  '- 追加実行: 公開読書監査成功後・関連ファイル変更時・手動',
  '- ブラウザー: Chromium desktop / WebKit mobile',
  '- Service Worker: 実際に許可して登録・制御・Cache Storageを検証',
  '- Chromium通信遮断: Playwright browser contextをofflineへ切り替えて画面遷移を検証',
  '- WebKit通信遮断相当: Playwright内部エラー回避のためService WorkerのCache Storage応答本文と依存資産を検証',
  '- 対象: 閲覧済み作品・未保存作品・読書記録・manifest・icon',
  '- 再試行: 最大1回',
  '- 実行上限: 20分',
  '- 失敗資料: HTML・trace・screenshot・videoを14日保存',
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  '',
  '## エラー',
  '',
  ...(errors.length?errors.map(error=>`- ${error}`):['- なし']),
  '',
  '## 警告',
  '',
  ...(warnings.length?warnings.map(warning=>`- ${warning}`):['- なし']),
  '',
].join('\n');

fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','offline-public-browser-workflow-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
