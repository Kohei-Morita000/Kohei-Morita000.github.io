import fs from 'node:fs';
import path from 'node:path';

const PROJECT_NAMES=new Set(['chromium-desktop','webkit-mobile']);

class OfflineBrowserReporter{
  constructor(){this.started=Date.now();this.results=new Map();}
  printsToStdio(){return false;}
  onTestEnd(test,result){
    const titlePath=test.titlePath().filter(Boolean);
    const project=titlePath.find(value=>PROJECT_NAMES.has(value))||test.parent?.project?.()?.name||'unknown';
    const title=titlePath.filter(value=>value!==project).join(' › ')||test.title;
    const key=`${project}:${test.id}`;
    this.results.set(key,{
      project,
      title,
      status:result.status,
      duration:result.duration,
      retry:result.retry,
      error:result.error?.message?.split('\n')[0]||'',
    });
  }
  onEnd(fullResult){
    const rows=[...this.results.values()].sort((a,b)=>a.project.localeCompare(b.project)||a.title.localeCompare(b.title));
    const passed=rows.filter(row=>row.status==='passed').length;
    const failed=rows.filter(row=>['failed','timedOut','interrupted'].includes(row.status)).length;
    const skipped=rows.filter(row=>row.status==='skipped').length;
    const projects=[...new Set(rows.map(row=>row.project))];
    const target=process.env.OFFLINE_BASE_URL?.trim()||'https://allsunday1122.github.io/kyokai-yawa/';
    const report=[
      '# 境界夜話 公開サイト オフライン・PWA 実ブラウザー監査',
      '',
      `- 実行日時: ${new Date().toISOString()}`,
      `- 実行対象: ${target}`,
      `- 実行環境: ${projects.join(' / ')||'なし'}`,
      '- 対象操作: Service Worker登録・事前保存・閲覧済み作品再読・未保存ページのオフライン案内・読書記録のオフライン表示・manifest/icon配信',
      '- テスト領域: 実行ごとに独立したブラウザー保存領域',
      `- テスト結果: ${fullResult.status}`,
      `- 成功: ${passed}`,
      `- 失敗: ${failed}`,
      `- スキップ: ${skipped}`,
      `- 所要時間: ${((Date.now()-this.started)/1000).toFixed(1)}秒`,
      '',
      '## ケース別結果',
      '',
      '| ブラウザー | テスト | 結果 | 時間 |',
      '|---|---|---:|---:|',
      ...rows.map(row=>`| ${row.project} | ${row.title.replaceAll('|','\\|')} | ${row.status}${row.retry?`（再試行${row.retry}）`:''} | ${row.duration}ms |`),
      '',
      '## エラー',
      '',
      ...(failed?rows.filter(row=>row.error).map(row=>`- ${row.project} / ${row.title}: ${row.error}`):['- なし']),
      '',
    ].join('\n');
    fs.mkdirSync(path.join(process.cwd(),'reports'),{recursive:true});
    fs.writeFileSync(path.join(process.cwd(),'reports','offline-public-browser-audit.md'),report);
  }
}

export default OfflineBrowserReporter;
