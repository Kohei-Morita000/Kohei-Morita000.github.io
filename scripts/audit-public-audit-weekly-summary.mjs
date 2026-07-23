import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const warnings=[];
const read=file=>fs.existsSync(path.join(root,file))?fs.readFileSync(path.join(root,file),'utf8'):'';

const builderPath='scripts/build-public-audit-weekly-summary.mjs';
const workflowPath='.github/workflows/public-audit-weekly-summary.yml';
const summaryPath='reports/public-audit-weekly-summary.md';
const builder=read(builderPath);
const workflow=read(workflowPath);
const summary=read(summaryPath);

for(const [file,text] of [[builderPath,builder],[workflowPath,workflow],[summaryPath,summary]])if(!text)errors.push(`${file}が存在しないか空です`);

const builderTokens=[
  'periodDays=7',
  'git',
  "['log','--all','--format=%H'",
  "['show',`${sha}:${file}`]",
  'reports/reading-public-browser-audit.md',
  'reports/site-public-health-audit.md',
  'reports/offline-public-browser-audit.md',
  'public-audit-weekly-summary.md',
  '再試行発生',
  '失敗・再試行履歴',
  '外部分析サービス不使用',
];
for(const token of builderTokens)if(!builder.includes(token))errors.push(`週次集計処理に必要な定義がありません: ${token}`);
if(builder.includes('fetch(')||builder.includes('XMLHttpRequest')||builder.includes('https://'))errors.push('週次集計処理が外部通信先を含んでいます');

const workflowTokens=[
  "cron: '0 22 * * 0'",
  'workflow_dispatch:',
  'fetch-depth: 0',
  'timeout-minutes: 10',
  'node scripts/build-public-audit-weekly-summary.mjs',
  'node scripts/audit-public-audit-weekly-summary.mjs',
  'reports/public-audit-weekly-summary.md',
  'reports/public-audit-weekly-summary-workflow-audit.md',
  'retention-days: 28',
  'git pull --rebase origin main',
  'contents: write',
];
for(const token of workflowTokens)if(!workflow.includes(token))errors.push(`週次ワークフローに必要な定義がありません: ${token}`);
if(!workflow.includes('concurrency:')||!workflow.includes('cancel-in-progress: true'))errors.push('週次ワークフローに重複実行防止がありません');

const summaryTokens=[
  '# 境界夜話 公開監査 週次サマリー',
  '- 集計期間:',
  '- 実行記録:',
  '- 成功実行:',
  '- 失敗実行:',
  '- 再試行発生:',
  '- 直近状態:',
  '## 監査別集計',
  '## 失敗・再試行履歴',
  '## 直近結果',
  '読書機能',
  'アクセシビリティ・実行時品質',
  'オフライン・PWA',
];
for(const token of summaryTokens)if(!summary.includes(token))errors.push(`週次サマリーに必要な項目がありません: ${token}`);
const runCount=Number(summary.match(/^- 実行記録:\s*(\d+)件/m)?.[1]||0);
if(runCount<3)warnings.push(`集計期間内の実行記録が少ないです（${runCount}件）`);
if(summary.includes('外部送信'))warnings.push('週次サマリーに外部送信という文言があります。内容を確認してください');

const report=[
  '# 境界夜話 公開監査週次サマリー 設定監査',
  '',
  '- 集計期間: 過去7日',
  '- 集計元: Git履歴内の読書・実行時品質・オフライン監査レポート',
  '- 定期実行: 毎週月曜07:00 JST',
  '- 履歴取得: checkout fetch-depth 0',
  '- 外部分析サービス: 使用しない',
  '- 成果物保存: 28日',
  `- 集計済み実行記録: ${runCount}件`,
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
fs.writeFileSync(path.join(root,'reports','public-audit-weekly-summary-workflow-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
