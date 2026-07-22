import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const workflow=read('.github/workflows/reading-public-browser-audit.yml');
const config=read('playwright.config.mjs');
const tests=read('tests/reading-backup.spec.mjs');
const reporter=read('scripts/reading-browser-reporter.mjs');
const errors=[];
const warnings=[];

const requiredWorkflow=[
  ["cron: '30 21 * * *'",'毎日06:30 JSTの定期実行'],
  ['workflow_run:','主要ワークフロー完了後の実行'],
  ['workflow_dispatch:','手動実行'],
  ['PLAYWRIGHT_BASE_URL: https://allsunday1122.github.io/kyokai-yawa/','公開サイトURL'],
  ['READING_BROWSER_REPORT: reading-public-browser-audit.md','公開専用レポート'],
  ['timeout-minutes: 20','ジョブ実行上限'],
  ['sleep 60','GitHub Pages反映待機'],
  ['--retries=2','公開試験の再試行'],
  ['retention-days: 14','失敗資料の保存期間'],
  ['contents: write','監査レポート保存権限'],
];
for(const [token,label] of requiredWorkflow)if(!workflow.includes(token))errors.push(`${label}がありません`);
for(const workflowName of ['Reading Backup Browser Audit','Reading Log Audit','Content Audit'])if(!workflow.includes(`- '${workflowName}'`))errors.push(`${workflowName}完了後の起動設定がありません`);
for(const asset of ['reports/reading-public-browser-audit.md','playwright-report','test-results'])if(!workflow.includes(asset))errors.push(`監査成果物がありません: ${asset}`);
if(!config.includes("const publicBaseURL=process.env.PLAYWRIGHT_BASE_URL?.trim()"))errors.push('公開URLへの切替処理がありません');
if(!config.includes('const webServer=publicBaseURL?undefined'))errors.push('公開試験時にローカルサーバーを無効化していません');
for(const browser of ["name:'chromium-desktop'","name:'webkit-mobile'"])if(!config.includes(browser))errors.push(`ブラウザー設定がありません: ${browser}`);
for(const token of ['JSON書き出し','追加復元','置換復元','壊れたJSON','未知の作品ID','モバイル幅'])if(!tests.includes(token))errors.push(`実操作試験がありません: ${token}`);
if(!reporter.includes("process.env.READING_BROWSER_REPORT"))errors.push('公開専用レポート名への切替がありません');
if(!reporter.includes("process.env.PLAYWRIGHT_BASE_URL"))errors.push('監査対象URLのレポート記録がありません');
if(workflow.includes('schedule:')&&!workflow.includes("cron: '30 21 * * *'"))warnings.push('定期実行時刻が06:30 JSTから変更されています');

const report=[
  '# 境界夜話 公開サイト実ブラウザー定期監査 設定監査',
  '',
  '- 実行対象: GitHub Pages公開サイト',
  '- 定期実行: 毎日06:30 JST',
  '- 追加実行: 主要読書ワークフロー完了後・設定変更時・手動',
  '- ブラウザー: Chromium desktop / WebKit mobile',
  '- 操作対象: JSON書き出し・追加復元・置換復元・不正JSON拒否・画面反映',
  '- 再試行: 最大2回',
  '- 実行上限: 20分',
  '- 失敗資料: HTML・trace・screenshot・videoを14日保存',
  `- エラー: ${errors.length}`,
  `- 警告: ${warnings.length}`,
  '',
  '## エラー',
  '',
  ...(errors.length?errors.map(value=>`- ${value}`):['- なし']),
  '',
  '## 警告',
  '',
  ...(warnings.length?warnings.map(value=>`- ${value}`):['- なし']),
  '',
].join('\n');
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports','reading-public-browser-workflow-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
