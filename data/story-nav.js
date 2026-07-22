(()=>{
  const works=window.KYOKAI_WORKS||[];
  const nav=document.querySelector('.footer-nav');
  if(!nav||!works.length)return;

  const file=decodeURIComponent(location.pathname.split('/').pop()||'');
  const current=works.find(work=>work.file===file);
  if(!current)return;

  const group=works.filter(work=>work.series===current.series);
  const index=group.findIndex(work=>work.id===current.id);
  if(index<0)return;

  const esc=value=>String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const href=work=>`/kyokai-yawa/stories/${encodeURIComponent(work.file).replace(/%2F/gi,'/')}`;
  const seriesPage={
    '真壁夜話':'makabe.html',
    '黒瀬蒐集録':'kurose.html',
    '榊家異聞':'sakaki.html',
    '境界観測記':'kansoku.html'
  }[current.series];
  if(!seriesPage)return;

  const previous=group[index-1];
  const next=group[index+1];
  const previousHtml=previous
    ? `<a class="story-nav-link previous" href="${href(previous)}"><span>前の話</span><strong>${esc(previous.title)}</strong></a>`
    : '<span class="story-nav-link disabled" aria-disabled="true"><span>前の話</span><strong>シリーズ第1話</strong></span>';
  const nextHtml=next
    ? `<a class="story-nav-link next" href="${href(next)}"><span>次の話</span><strong>${esc(next.title)}</strong></a>`
    : '<span class="story-nav-link disabled" aria-disabled="true"><span>次の話</span><strong>シリーズ最終話</strong></span>';

  nav.setAttribute('aria-label',`${current.series}の前後話`);
  nav.innerHTML=`${previousHtml}<a class="story-nav-link series-index" href="/kyokai-yawa/series/${seriesPage}"><span>シリーズ一覧</span><strong>${esc(current.series)}</strong></a>${nextHtml}`;

  const style=document.createElement('style');
  style.textContent=`
    .footer-nav{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px!important;align-items:stretch!important}
    .footer-nav .story-nav-link{display:flex;min-height:76px;flex-direction:column;justify-content:center;gap:5px;text-decoration:none;border:1px solid var(--line);background:#13110f;padding:11px 14px;min-width:0}
    .footer-nav .story-nav-link span{color:var(--muted);font-size:.76rem}
    .footer-nav .story-nav-link strong{font-family:Georgia,"Yu Mincho","Hiragino Mincho ProN",serif;font-size:.94rem;font-weight:500;line-height:1.45;overflow-wrap:anywhere}
    .footer-nav .next{text-align:right}
    .footer-nav .series-index{text-align:center}
    .footer-nav .disabled{opacity:.5;cursor:default}
    @media(max-width:720px){.footer-nav{grid-template-columns:1fr!important}.footer-nav .next,.footer-nav .series-index{text-align:left}}
  `;
  document.head.appendChild(style);
})();
