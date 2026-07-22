import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const indexPath=path.join(root,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
const before=html;

const cssTag='<link rel="stylesheet" href="/kyokai-yawa/data/entry-guide.css">';
html=html.replaceAll(cssTag,'');
html=html.replace(/<\/head>/i,`${cssTag}\n</head>`);

html=html.replace(/<a href="#start">初めての方<\/a>/g,'');
html=html.replace(/<nav class="nav-links" aria-label="主要メニュー">/,'<nav class="nav-links" aria-label="主要メニュー"><a href="#start">初めての方</a>');

const section=`<!-- ENTRY_GUIDE_START -->
<section class="section entry-guide" id="start" aria-labelledby="entry-guide-title">
  <div class="wrap">
    <div class="section-head">
      <div class="entry-intro"><p class="eyebrow">FIRST READING GUIDE</p><h2 id="entry-guide-title">初めて読む方へ</h2></div>
      <p>今読みたい怖さに近い項目を選んでください。各シリーズの第1話から始められます。</p>
    </div>
    <div class="entry-choice-grid">
      <article class="entry-choice" data-entry-series="真壁夜話">
        <p class="entry-choice-label">仕事・機械・記録が怖い</p><h3>真壁夜話</h3>
        <p class="entry-choice-summary">勤怠、入館、予約、決済など、日常の業務記録が現実を先回りする現代怪談。</p>
        <dl class="entry-choice-meta"><div><dt>読み方</dt><dd>各話独立。題名から選べます</dd></div><div><dt>読後感</dt><dd>身近な仕組みへの不信</dd></div></dl>
        <div class="entry-choice-actions"><a class="entry-series-link" data-entry-series-link href="/kyokai-yawa/series/makabe.html">シリーズ案内</a><a class="entry-story-link" data-entry-story-link href="/kyokai-yawa/stories/mkb-001-taikin-kiroku-2514.html">第1話を読む</a></div>
      </article>
      <article class="entry-choice" data-entry-series="黒瀬蒐集録">
        <p class="entry-choice-label">土地・民俗・古い資料が怖い</p><h3>黒瀬蒐集録</h3>
        <p class="entry-choice-summary">古地図、台帳、祭礼記録を照合し、土地に埋め込まれた怪異の規則を復元する調査怪談。</p>
        <dl class="entry-choice-meta"><div><dt>読み方</dt><dd>各話独立。公開順も推奨</dd></div><div><dt>読後感</dt><dd>土地の記録が残す後味</dd></div></dl>
        <div class="entry-choice-actions"><a class="entry-series-link" data-entry-series-link href="/kyokai-yawa/series/kurose.html">シリーズ案内</a><a class="entry-story-link" data-entry-story-link href="/kyokai-yawa/stories/krs-001-sanbonme-no-sakaigi.html">第1話を読む</a></div>
      </article>
      <article class="entry-choice" data-entry-series="榊家異聞">
        <p class="entry-choice-label">家族・遺品・記憶が怖い</p><h3>榊家異聞</h3>
        <p class="entry-choice-summary">家族だけが共有していた記憶と人数が、古い家や遺品を通じて静かに組み替わる家族怪談。</p>
        <dl class="entry-choice-meta"><div><dt>読み方</dt><dd>第1話から公開順を推奨</dd></div><div><dt>読後感</dt><dd>静かな不安と家族の余韻</dd></div></dl>
        <div class="entry-choice-actions"><a class="entry-series-link" data-entry-series-link href="/kyokai-yawa/series/sakaki.html">シリーズ案内</a><a class="entry-story-link" data-entry-story-link href="/kyokai-yawa/stories/skk-001-butsuma-no-natsufuku.html">第1話を読む</a></div>
      </article>
      <article class="entry-choice" data-entry-series="境界観測記">
        <p class="entry-choice-label">調査チーム・連作・伏線が好き</p><h3>境界観測記</h3>
        <p class="entry-choice-summary">佐伯冬真と御厨澪が、場所・記録・認識の境目で起きる案件を観測し、対処する連作怪談。</p>
        <dl class="entry-choice-meta"><div><dt>読み方</dt><dd>Season 1を第1話から順番に</dd></div><div><dt>読後感</dt><dd>事件解決と継続する伏線</dd></div></dl>
        <div class="entry-choice-actions"><a class="entry-series-link" data-entry-series-link href="/kyokai-yawa/series/kansoku.html">シリーズ案内</a><a class="entry-story-link" data-entry-story-link href="/kyokai-yawa/stories/kks-s1e01-sakaime-no-heya.html">第1話を読む</a></div>
      </article>
    </div>
    <div class="entry-order-note"><strong>迷った場合</strong><p>短く身近な話なら「真壁夜話」、調査の過程を読みたいなら「黒瀬蒐集録」、感情の余韻なら「榊家異聞」、人物と伏線を追うなら「境界観測記」から始めてください。</p></div>
  </div>
</section>
<!-- ENTRY_GUIDE_END -->`;

html=html.replace(/\s*<!-- ENTRY_GUIDE_START -->[\s\S]*?<!-- ENTRY_GUIDE_END -->/g,'');
const hero=html.match(/<section class="hero"[\s\S]*?<\/section>/i)?.[0];
if(!hero)throw new Error('トップページのheroセクションが見つかりません');
html=html.replace(hero,`${hero}\n${section}`);

fs.writeFileSync(indexPath,html);
console.log(`# 初読者向けおすすめ入口の正規化\n\n- 比較カード: 4件\n- シリーズリンク: 4件\n- 代表作リンク: 4件\n- 更新: ${html===before?'なし':'あり'}\n`);
