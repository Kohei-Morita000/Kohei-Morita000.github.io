import fs from 'node:fs';
import path from 'node:path';

const PROJECT_NAMES=new Set(['chromium-desktop','webkit-mobile']);

class SiteHealthReporter{
  constructor(){this.started=Date.now();this.results=new Map();}
  printsToStdio(){return false;}
  onTestEnd(test,result){
    const titlePath=test.titlePath().filter(Boolean);
    const project=titlePath.find(value=>PROJECT_NAMES.has(value))||test.parent?.project?.()?.name||'unknown';
    const title=titlePath.filter(value=>value!==project).join(' › ')||test.title;
    const page=test.annotations.find(annotation=>annotation.type==='page')?.description||'';
    const key=`${project}:${test.id}`;
    this.results.set(key,{
      project,
      title,
      page,
      status:result.status,
      duration:result.duration,
      retry:result.retry,
      error:(result.error?.message||'').replace(/\x1b\[[0-9;]*m/g,'').slice(0,2000),
    });
  }
  onEnd(fullResult){
    const rows=[...this.results.values()].sort((a,b)=>a.project.localeCompare(b.project)||a.page.localeCompare(b.page));
    const passed=rows.filter(row=>row.status==='passed').length;
    const failed=rows.filter(row=>['failed','timedOut','interrupted'].includes(row.status)).length;
    const skipped=rows.filter(row=>row.status==='skipped').length;
    const projects=[...new Set(rows.map(row=>row.project))];
    const target=process.env.PLAYWRIGHT_BASE_URL?.trim()||'ローカル生成サイト';
    const reportName=process.env.SITE_HEALTH_REPORT?.trim()||'site-health-browser-audit.md';
    const report=[
      '# 境界夜話 公開サイト アクセシビリティ・実行時品質監査',
      '',
      `- 実行日時: ${new Date().toISOString()}`,
      `- 実行対象: ${target}`,
      `- 実行環境: ${projects.join(' / ')||'なし'}`,
      '- 対象: トップ・4シリーズ・単独作品・連作作品・読書記録',
      '- アクセシビリティ: axe-core WCAG 2.1 A/AA',
      '- 実行時監視: console.error・JavaScript例外・通信失敗・HTTP 4xx/5xx',
      `- テスト結果: ${fullResult.status}`,
      `- 成功: ${passed}`,
      `- 失敗: ${failed}`,
      `- スキップ: ${skipped}`,
      `- 所要時間: ${((Date.now()-this.started)/1000).toFixed(1)}秒`,
      '',
      '## ページ別結果',
      '',
      '| ブラウザー | ページ | 結果 | 時間 |',
      '|---|---|---:|---:|',
      ...rows.map(row=>`| ${row.project} | ${(row.page||row.title).replaceAll('|','\\|')} | ${row.status}${row.retry?`（再試行${row.retry}）`:''} | ${row.duration}ms |`),
      '',
      '## エラー',
      '',
      ...(failed?rows.filter(row=>row.error).map(row=>`### ${row.project} / ${row.page||row.title}\n\n\`\`\`text\n${row.error}\n\`\`\``):['- なし']),
      '',
    ].join('\n');
    fs.mkdirSync(path.join(process.cwd(),'reports'),{recursive:true});
    fs.writeFileSync(path.join(process.cwd(),'reports',reportName),report);
  }
}

export default SiteHealthReporter;
