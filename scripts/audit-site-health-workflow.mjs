import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const workflow=read('.github/workflows/public-site-health-audit.yml');
const pkg=JSON.parse(read('package.json'));
const config=read('playwright.config.mjs');
const tests=read('tests/site-health.spec.mjs');
const reporter=read('scripts/site-health-reporter.mjs');
const errors=[];
const warnings=[];

const requirements=[
  ["cron: '45 21 * * *'",'毎日06:45 JSTの定期実行'],
  ['PLAYWRIGHT_BASE_URL: https://allsunday1122.github.io/kyokai-yawa/','GitHub Pages公開URL'],
  ['SITE_HEALTH_REPORT: site-public-health-audit.md','公開品質専用レポート'],
  ['timeout-minutes: 20','実行上限'],
  ['sleep 60','公開反映待機'],
  ['--retries=1','一時障害の再試行'],
  ['retention-days: 14','失敗資料の保存期間'],
  ['contents: write','監査レポート保存権限'],
  ['tests/site-health.spec.mjs','実ブラウザー品質試験'],
];
for(const [fragment,label] of requirements)if(!workflow.includes(fragment))errors.push(`${label}がありません`);
if(pkg.devDependencies?.['@axe-core/playwright']!=='4.10.2')errors.push('@axe-core/playwrightの固定バージョンがありません');
if(!config.includes('siteHealthMode')||!config.includes('site-health-reporter.mjs'))errors.push('Playwright設定に品質監査レポーター切替がありません');
for(const token of ['wcag2a','wcag2aa','wcag21a','wcag21aa','pageerror','requestfailed','consoleErrors','badResponses'])if(!tests.includes(token))errors.push(`品質試験に必要な監視がありません: ${token}`);
const targetLabels=['トップ','真壁夜話','黒瀬蒐集録','榊怪異相談所','境界観測記','単独作品','連作作品','読書記録'];
for(const token of targetLabels)if(!tests.includes(token))errors.push(`代表ページが品質試験にありません: ${token}`);
if(targetLabels.length*2!==16)errors.push('品質試験の想定ケース数が16件ではありません');
if(!reporter.includes('アクセシビリティ・実行時品質監査'))errors.push('品質監査レポート見出しがありません');
if(!workflow.includes('playwright-report')||!workflow.includes('test-results'))errors.push('失敗時のトレース・画面資料が保存対象にありません');

const report=[
  '# 境界夜話 公開サイト品質定期監査 設定監査',
  '',
  '- 定期実行: 毎日06:45 JST',
  '- 追加実行: 公開読書監査完了後・設定変更時・手動',
  '- ブラウザー: Chromium desktop / WebKit mobile',
  '- 対象ページ: トップ・4シリーズ・単独作品・連作作品・読書記録',
  '- 実行ケース: 8ページ×2ブラウザー＝16件',
  '- アクセシビリティ: axe-core WCAG 2.1 A/AA',
  '- 実行時監視: console.error・JavaScript例外・通信失敗・HTTP 4xx/5xx',
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
fs.writeFileSync(path.join(root,'reports','site-health-workflow-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
