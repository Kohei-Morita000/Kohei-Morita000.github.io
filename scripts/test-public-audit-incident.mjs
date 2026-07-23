import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  INCIDENT_LABEL,
  INCIDENT_MARKER,
  INCIDENT_TITLE,
  LEGACY_INCIDENT_LABEL,
  LEGACY_INCIDENT_MARKER,
  managePublicAuditIncident,
} from './public-audit-incident.mjs';

const makeContext=()=>({
  serverUrl:'https://github.com',
  runId:123456,
  sha:'0123456789abcdef',
  repo:{owner:'ALLSUNDAY1122',repo:'kyokai-yawa'},
});

const makeMock=({labelExists=false,issues=[]}={})=>{
  const state={labelExists,issues:structuredClone(issues),comments:[],createdLabels:[],updates:[]};
  const github={rest:{issues:{
    async getLabel(){if(!state.labelExists){const error=new Error('Not Found');error.status=404;throw error;}return {data:{name:INCIDENT_LABEL}};},
    async createLabel(args){state.labelExists=true;state.createdLabels.push(args);return {data:args};},
    async listForRepo(){return {data:state.issues.filter(issue=>issue.state==='open')};},
    async create(args){const issue={number:state.issues.length+1,state:'open',...args};state.issues.push(issue);return {data:issue};},
    async createComment(args){state.comments.push(args);return {data:args};},
    async update(args){state.updates.push(args);const issue=state.issues.find(item=>item.number===args.issue_number);if(issue)Object.assign(issue,args);return {data:issue};},
  }}};
  return {github,state};
};

const currentIssue=number=>({number,state:'open',title:INCIDENT_TITLE,body:`${INCIDENT_MARKER}\n未復旧`,labels:[{name:INCIDENT_LABEL}]});
const legacyIssue=(number,name='Public Site Health Audit')=>({
  number,
  state:'open',
  title:`[監視] 境界夜話 ${name} 失敗`,
  body:`${LEGACY_INCIDENT_MARKER}\n旧監視の未復旧障害`,
  labels:[{name:LEGACY_INCIDENT_LABEL}],
});
const context=makeContext();

{
  const {github,state}=makeMock();
  const result=await managePublicAuditIncident({github,context,failed:true,readingOutcome:'failure',healthOutcome:'success'});
  assert.equal(result.action,'created');
  assert.equal(state.createdLabels.length,1);
  assert.equal(state.issues.length,1);
  assert.equal(state.issues[0].title,INCIDENT_TITLE);
  assert.ok(state.issues[0].body.includes(INCIDENT_MARKER));
  assert.ok(state.issues[0].body.includes('読書機能監査: failure'));
}

{
  const {github,state}=makeMock({labelExists:true,issues:[currentIssue(7)]});
  const result=await managePublicAuditIncident({github,context,failed:true,readingOutcome:'failure',healthOutcome:'failure'});
  assert.equal(result.action,'commented');
  assert.equal(state.issues.length,1);
  assert.equal(state.comments.length,1);
  assert.equal(state.comments[0].issue_number,7);
}

{
  const {github,state}=makeMock({labelExists:true,issues:[currentIssue(8)]});
  const result=await managePublicAuditIncident({github,context,failed:false,readingOutcome:'success',healthOutcome:'success'});
  assert.equal(result.action,'closed');
  assert.equal(state.comments.length,1);
  assert.equal(state.updates.length,1);
  assert.equal(state.updates[0].state,'closed');
  assert.equal(state.updates[0].state_reason,'completed');
}

{
  const {github,state}=makeMock({labelExists:true});
  const result=await managePublicAuditIncident({github,context,failed:false,readingOutcome:'success',healthOutcome:'success'});
  assert.equal(result.action,'none');
  assert.equal(state.comments.length,0);
  assert.equal(state.updates.length,0);
}

{
  const {github,state}=makeMock({labelExists:true,issues:[legacyIssue(34)]});
  const result=await managePublicAuditIncident({github,context,failed:false,readingOutcome:'success',healthOutcome:'success'});
  assert.equal(result.action,'closed');
  assert.equal(result.issueNumber,34);
  assert.equal(state.comments.length,1);
  assert.equal(state.updates.length,1);
  assert.equal(state.issues[0].state,'closed');
}

{
  const {github,state}=makeMock({labelExists:true,issues:[legacyIssue(35)]});
  const result=await managePublicAuditIncident({github,context,failed:true,readingOutcome:'success',healthOutcome:'failure'});
  assert.equal(result.action,'migrated');
  assert.equal(result.issueNumber,35);
  assert.equal(state.updates.length,1);
  assert.equal(state.issues[0].state,'open');
  assert.equal(state.issues[0].title,INCIDENT_TITLE);
  assert.ok(state.issues[0].body.includes(INCIDENT_MARKER));
  assert.deepEqual(state.issues[0].labels,[INCIDENT_LABEL]);
}

{
  const issues=[currentIssue(40),legacyIssue(41)];
  const {github,state}=makeMock({labelExists:true,issues});
  const result=await managePublicAuditIncident({github,context,failed:true,readingOutcome:'failure',healthOutcome:'success'});
  assert.equal(result.action,'commented-and-closed-legacy');
  assert.deepEqual(result.closedLegacy,[41]);
  assert.equal(state.comments.length,2);
  assert.equal(state.issues.find(issue=>issue.number===40).state,'open');
  assert.equal(state.issues.find(issue=>issue.number===41).state,'closed');
}

{
  const issues=[currentIssue(50),legacyIssue(51,'Public Reading Browser Audit')];
  const {github,state}=makeMock({labelExists:true,issues});
  const result=await managePublicAuditIncident({github,context,failed:false,readingOutcome:'success',healthOutcome:'success'});
  assert.equal(result.action,'closed-multiple');
  assert.deepEqual(result.issueNumbers,[50,51]);
  assert.equal(state.comments.length,2);
  assert.equal(state.updates.length,2);
  assert.ok(state.issues.every(issue=>issue.state==='closed'));
}

const report=[
  '# 境界夜話 公開監査障害Issue通知 監査',
  '',
  '- 監査失敗時: 統合タイトルのIssueを新規作成',
  '- 連続失敗時: 既存の未解決統合Issueへ追記',
  '- 復旧時: 成功実行URLを追記して統合・旧方式Issueを自動クローズ',
  '- 旧Issue移行: site-monitoringの監視Issueを統合Issueへ移行または復旧終了',
  '- 重複防止: タイトル・専用ラベル・本文マーカーで識別',
  '- ラベル未作成時: 自動作成',
  '- 実行結果: 8/8ケース成功',
  '- エラー: 0',
  '- 警告: 0',
  '',
  '## ケース',
  '',
  '- 初回失敗で統合Issue作成',
  '- 連続失敗で既存統合Issueへコメント',
  '- 成功時に統合Issueをクローズ',
  '- 障害がない成功時は変更なし',
  '- 成功時に旧方式Issueをクローズ',
  '- 失敗時に旧方式Issueを統合形式へ移行',
  '- 統合Issueがある失敗時に旧重複Issueを終了',
  '- 成功時に統合・旧方式Issueを一括終了',
  '',
].join('\n');
fs.mkdirSync(path.join(process.cwd(),'reports'),{recursive:true});
fs.writeFileSync(path.join(process.cwd(),'reports','public-audit-incident-audit.md'),report);
console.log(report);
