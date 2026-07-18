from pathlib import Path

index_path = Path("index.html")
sitemap_path = Path("sitemap.xml")
index = index_path.read_text(encoding="utf-8")
sitemap = sitemap_path.read_text(encoding="utf-8")

story_path = "/kyokai-yawa/stories/mkb-010-kidoku-no-junban.html"
card = '      <a class="work-card" href="/kyokai-yawa/stories/mkb-010-kidoku-no-junban.html"><div><span class="id">MKB-010 · 真壁夜話</span><h3>既読の順番</h3><p>未送信の業務メッセージに付く既読順が、承認・確認・実行の履歴と参加者の記憶を過去へ遡って成立させる。</p></div><div class="work-meta"><span class="tag">短編</span><span class="tag">約6分</span><span class="tag">恐怖 3</span></div></a>'
card_anchor = '      <a class="work-card" href="/kyokai-yawa/stories/mkb-009-yoyakusha-mei-wa-kuran.html"><div><span class="id">MKB-009 · 真壁夜話</span><h3>予約者名は空欄</h3><p>予約者名だけが空欄の会議室予約が、座席と飲料に合わせて無関係な六人を統合し、受付担当者を主催者へ確定する。</p></div><div class="work-meta"><span class="tag">短編</span><span class="tag">約6分</span><span class="tag">恐怖 4</span></div></a>'

list_item = '<li><a class="story-link" href="/kyokai-yawa/stories/mkb-010-kidoku-no-junban.html"><span class="story-id">MKB-010</span><span class="story-title">既読の順番</span><span class="story-arrow">›</span></a></li>'
list_anchor = '<li><a class="story-link" href="/kyokai-yawa/stories/mkb-009-yoyakusha-mei-wa-kuran.html"><span class="story-id">MKB-009</span><span class="story-title">予約者名は空欄</span><span class="story-arrow">›</span></a></li>'

if story_path not in index:
    if card_anchor not in index or list_anchor not in index:
        raise SystemExit("MKB-009 anchor not found")
    index = index.replace(card_anchor, card_anchor + "\n" + card, 1)
    index = index.replace(list_anchor, list_anchor + list_item, 1)
    index = index.replace('<h3>真壁夜話</h3><span class="series-count">9話公開</span>', '<h3>真壁夜話</h3><span class="series-count">10話公開</span>', 1)

url = '  <url><loc>https://allsunday1122.github.io/kyokai-yawa/stories/mkb-010-kidoku-no-junban.html</loc><lastmod>2026-07-18</lastmod></url>'
if "mkb-010-kidoku-no-junban.html" not in sitemap:
    sitemap = sitemap.replace("</urlset>", url + "\n</urlset>", 1)

if index.count('class="work-card"') != 39:
    raise SystemExit(f"unexpected work-card count: {index.count('class=\"work-card\"')}")
if '<h3>真壁夜話</h3><span class="series-count">10話公開</span>' not in index:
    raise SystemExit("Makabe count was not updated")
if index.count("MKB-010") < 2:
    raise SystemExit("MKB-010 is missing from card or series list")
if sitemap.count("<url>") != 40:
    raise SystemExit(f"unexpected sitemap URL count: {sitemap.count('<url>')}")

index_path.write_text(index, encoding="utf-8")
sitemap_path.write_text(sitemap, encoding="utf-8")
print("MKB-010 archive update validated")
