import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const workflow=read('.github/workflows/reading-public-browser-audit.yml');
const config=read('playwright.config.mjs');
const backupTests=read('tests/reading-backup.spec.mjs');
const stateTests=read('tests/reading-state.spec.mjs');
const discoveryTests=read('tests/reading-discovery.spec.mjs');
const logTests=read('tests/reading-log-management.spec.mjs');
const statusTests=read('tests/status-page.spec.mjs');
const reporter=read('scripts/reading-browser-reporter.mjs');
const incident=read('scripts/public-audit-incident.mjs');
const incidentTests=read('scripts/test-public-audit-incident.mjs');
const errors=[];
const warnings=[];

const combinedTests='tests/reading-backup.spec.mjs tests/reading-state.spec.mjs tests/reading-discovery.spec.mjs tests/reading-log-management.spec.mjs tests/status-page.spec.mjs';
const requiredWorkflow=[
  ["cron: '30 21 * * *'",'毎日06:30 JSTの定期実行'],
  ['workflow_run:','主要ワークフロー完了後の実行'],
  ['workflow_dispatch:','手動実行'],
  ['PLAYWRIGHT_BASE_URL: https://allsunday1122.github.io/kyokai-yawa/','公開サイトURL'],
  ['READING_BROWSER_REPORT: reading-public-browser-audit.md','公開専用レポート'],
  ['timeout-minutes: 30','ジョブ実行上限'],
  ['sleep 60','GitHub Pages反映待機'],
  [combinedTests,'読書・検索・読書記録・運用状況の同時試験'],
  ['--retries=2','公開試験の再試行'],
  ['retention-days: 14','失敗資料の保存期間'],
  ['contents: write','監査レポート保存権限'],
  ['issues: write','障害Issue管理権限'],
  ['node scripts/test-public-audit-incident.mjs','障害Issueライフサイクル試験'],
  ['actions/github-script@v7','GitHub Issue操作'],
  ['managePublicAuditIncident','障害Issue管理処理'],
  ["AUDIT_FAILED: ${{ steps.tests.outcome == 'failure' || steps.health.outcome == 'failure' }}",'明確な失敗だけを障害扱いする判定'],
  ["AUDIT_RECOVERED: ${{ steps.tests.outcome == 'success' && steps.health.outcome == 'success' }}",'両監査成功時だけ復旧扱いする判定'],
  ['if (!failed && !recovered)','中止・スキップ時にIssueを変更しない判定'],
  ['run was inconclusive','中止・スキップ時の記録'],
];
for(const [token,label] of requiredWorkflow)if(!workflow.includes(token))errors.push(`${label}がありません`);
for(const workflowName of ['Reading Backup Browser Audit','Reading Log Audit','Content Audit','Public Home Personalization Browser Audit'])if(!workflow.includes(`- '${workflowName}'`))errors.push(`${workflowName}完了後の起動設定がありません`);
for(const asset of ['reports/reading-public-browser-audit.md','reports/public-audit-incident-audit.md','playwright-report','test-results'])if(!workflow.includes(asset))errors.push(`監査成果物がありません: ${asset}`);
for(const watched of ['index.html','reading-log.html','status.html','series/*.html','data/archive-tools.js','data/series-archive-tools.js','data/home-personalization.js','data/reading-log.js','data/status.js','tests/reading-discovery.spec.mjs','tests/reading-log-management.spec.mjs','tests/status-page.spec.mjs','scripts/public-audit-incident.mjs','scripts/test-public-audit-incident.mjs'])if(!workflow.includes(`- '${watched}'`))errors.push(`読書導線監査の変更監視がありません: ${watched}`);
if(!config.includes("const publicBaseURL=process.env.PLAYWRIGHT_BASE_URL?.trim()"))errors.push('公開URLへの切替処理がありません');
if(!config.includes('const webServer=publicBaseURL?undefined'))errors.push('公開試験時にローカルサーバーを無効化していません');
for(const browser of ["name:'chromium-desktop'","name:'webkit-mobile'"])if(!config.includes(browser))errors.push(`ブラウザー設定がありません: ${browser}`);
for(const token of ['JSON書き出し','追加復元','置換復元','壊れたJSON','未知の作品ID','モバイル幅'])if(!backupTests.includes(token))errors.push(`バックアップ実操作試験がありません: ${token}`);
for(const token of ['読了とあとで読む','途中位置を保存','resume=1','本文末尾で自動読了','次の未読作品'])if(!stateTests.includes(token))errors.push(`通常読書操作試験がありません: ${token}`);
for(const token of ['トップページで検索条件','シリーズページで検索','再訪履歴から続き','履歴がない初回訪問','分類JSONなしでも'])if(!discoveryTests.includes(token))errors.push(`検索・個別化実操作試験がありません: ${token}`);
for(const token of ['読書記録で検索','読了とあとで読むを変更','途中までの作品だけ','条件をリセット'])if(!logTests.includes(token))errors.push(`読書記録管理の実操作試験がありません: ${token}`);
for(const token of ['最新4監査','主要ページから運用状況','モバイル幅で運用状況','public-monitoring-history.json'])if(!statusTests.includes(token))errors.push(`運用状況ページ実操作試験がありません: ${token}`);
if(!reporter.includes('トップ/シリーズ検索・読了/保存絞り込み・個別化入口'))errors.push('検索・個別化操作が監査レポートの対象に記載されていません');
if(!reporter.includes('読書記録検索/状態管理/途中再開'))errors.push('読書記録管理が監査レポートの対象に記載されていません');
if(!reporter.includes('読了切替・あとで読む・途中位置保存/再開・自動読了・次の未読'))errors.push('通常読書操作が監査レポートの対象に記載されていません');
if(!reporter.includes('運用状況4監査表示・54ページ導線'))errors.push('運用状況ページが監査レポートの対象に記載されていません');
if(!reporter.includes("process.env.READING_BROWSER_REPORT"))errors.push('公開専用レポート名への切替がありません');
if(!reporter.includes("process.env.PLAYWRIGHT_BASE_URL"))errors.push('監査対象URLのレポート記録がありません');
for(const token of ['public-site-incident','[監査障害] 境界夜話 公開サイト','createLabel','listForRepo','createComment','state_reason:\'completed\''])if(!incident.includes(token))errors.push(`障害Issue処理がありません: ${token}`);
for(const token of ["action,'created'","action,'commented'","action,'closed'","action,'none'"])if(!incidentTests.includes(token))errors.push(`障害Issue試験がありません: ${token}`);
if(workflow.includes('schedule:')&&!workflow.includes("cron: '30 21 * * *'"))warnings.push('定期実行時刻が06:30 JSTから変更されています');

const report=[
  '# 境界夜話 公開サイト実ブラウザー定期監査 設定監査',
  '',
  '- 実行対象: GitHub Pages公開サイト',
  '- 定期実行: 毎日06:30 JST',
  '- 追加実行: 主要読書ワークフロー・個別化軽量監査完了後・設定変更時・手動',
  '- ブラウザー: Chromium desktop / WebKit mobile',
  '- 操作対象: トップ/シリーズ検索・読了/保存絞り込み・個別化入口・読書記録検索/状態管理/途中再開・読了切替・あとで読む・途中位置保存/再開・自動読了・次の未読・JSON書き出し/追加復元/置換復元・不正JSON拒否・運用状況4監査表示・54ページ導線・画面反映',
  '- 再試行: 最大2回',
  '- 実行上限: 30分',
  '- 失敗資料: HTML・trace・screenshot・videoを14日保存',
  '- 障害通知: 明確なfailureだけIssue作成・追記、両監査success時だけ復旧クローズ',
  '- 中止・スキップ: 新しい監査への置換としてIssueを変更しない',
  '- 重複防止: 固定タイトル・専用ラベル・本文マーカー',
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