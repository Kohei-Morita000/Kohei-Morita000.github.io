import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const workflowPath=path.join(root,'.github','workflows','public-audit-incident.yml');
const errors=[];
const warnings=[];

if(!fs.existsSync(workflowPath))errors.push('障害通知ワークフローが存在しません');
const workflow=fs.existsSync(workflowPath)?fs.readFileSync(workflowPath,'utf8'):'';

const requirements=[
  ['name: Public Audit Incident Notification','ワークフロー名'],
  ["workflows: ['Public Reading Browser Audit']",'公開監査完了トリガー'],
  ['types: [completed]','完了時トリガー'],
  ['issues: write','Issue更新権限'],
  ['actions: read','Actions参照権限'],
  ['contents: write','設定監査レポート保存権限'],
  ["head_repository.full_name == github.repository",'同一リポジトリ制限'],
  ["head_branch == 'main'",'mainブランチ制限'],
  ["const title='[監視] 境界夜話 公開サイト監査失敗'",'固定Issueタイトル'],
  ["const label='site-monitoring'",'固定監視ラベル'],
  ["run.conclusion!=='success'",'非成功時の障害判定'],
  ['github.rest.issues.create','障害Issue作成'],
  ['github.rest.issues.createComment','連続失敗・復旧コメント'],
  ["state:'closed'",'復旧時のIssueクローズ'],
  ['github.rest.issues.createLabel','監視ラベル自動作成'],
  ['github.paginate','既存Issueの全件確認'],
  ['cancel-in-progress: false','障害・復旧イベントの直列処理'],
  ['reports/public-audit-incident-workflow-audit.md','設定監査レポート'],
];
for(const [fragment,label] of requirements)if(!workflow.includes(fragment))errors.push(`${label}がありません`);

const createCount=(workflow.match(/github\.rest\.issues\.create\(/g)||[]).length;
if(createCount!==1)errors.push(`Issue作成処理が1件ではありません（${createCount}件）`);
if(!workflow.includes("issues.find(issue=>!issue.pull_request&&issue.title===title)"))errors.push('同名の既存Issueを再利用する処理がありません');
if(!workflow.includes("if(incident)"))errors.push('連続失敗を既存Issueへ追記する分岐がありません');
if(!workflow.includes("else if(incident)"))errors.push('正常復旧時だけIssueを閉じる分岐がありません');
if(workflow.includes('pull_request_target'))errors.push('pull_request_targetを使用しています');

const report=[
  '# 境界夜話 公開監査障害Issue通知 設定監査',
  '',
  '- 監視対象: Public Reading Browser Audit',
  '- 障害判定: failure・cancelled・timed_out・skipped等の非success',
  '- 通知方法: GitHub Issueを1件だけ作成し、連続失敗は同じIssueへ追記',
  '- 復旧処理: 次回success時に復旧コメントを追加して自動クローズ',
  '- 実行制限: 同一リポジトリ・mainブランチのみ',
  '- ラベル: site-monitoring（未作成なら自動作成）',
  '- 外部送信: なし',
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
fs.writeFileSync(path.join(root,'reports','public-audit-incident-workflow-audit.md'),report);
console.log(report);
if(errors.length)process.exitCode=1;
