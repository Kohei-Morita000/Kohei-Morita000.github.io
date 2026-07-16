export type TaxonomyItem = {
  slug: string;
  label: string;
  description: string;
};

export type FearLevel = {
  level: number;
  label: string;
  description: string;
};

export const mainCategories: TaxonomyItem[] = [
  {
    slug: "true-stories",
    label: "本当にあった怖い話",
    description:
      "体験談の語り口を重視した怪談です。事実性を断定せず、記憶と証言の揺らぎを含めて楽しめる作品を集めます。",
  },
  {
    slug: "ghosts",
    label: "心霊・幽霊",
    description:
      "人ならざる気配、見えない同居人、死者の影を扱う作品です。直接的な恐怖よりも、痕跡と余韻を重視します。",
  },
  {
    slug: "urban-legends",
    label: "都市伝説",
    description:
      "現代の噂、場所に結びついた言い伝え、ネットで変形していく怪異を扱います。解説記事と創作怪談は明確に分けます。",
  },
  {
    slug: "meaning",
    label: "意味が分かると怖い話",
    description:
      "読み返したときに別の意味が立ち上がる短編群です。解説の有無や伏線の強さでも探せます。",
  },
  {
    slug: "slow-burn",
    label: "じわじわ怖い話",
    description:
      "大きな事件よりも、違和感の反復や日常の変質で怖さを積み上げる作品です。",
  },
  {
    slug: "human-horror",
    label: "人間が怖い話",
    description:
      "幽霊よりも人間の執着、悪意、集団心理、家庭や職場の歪みが恐怖の中心になる作品です。",
  },
  {
    slug: "mystery",
    label: "不可解・謎",
    description:
      "原因が説明されない出来事、時間や記憶のずれ、記録の矛盾などを扱う作品です。",
  },
  {
    slug: "folklore",
    label: "妖怪・伝承",
    description:
      "土地の言い伝え、妖怪、古い儀式、禁忌を題材にした作品です。伝承の扱いは出典と創作の区別を大切にします。",
  },
  {
    slug: "dreams",
    label: "夢・睡眠",
    description:
      "夢、寝ぼけ、金縛り、眠る前後の境界で起こる怪異を集めます。",
  },
  {
    slug: "internet",
    label: "ネット怪談",
    description:
      "掲示板、動画、SNS、AI、端末通知など、ネット環境と結びついた現代怪談です。",
  },
  {
    slug: "classic",
    label: "古典怪談",
    description:
      "古典的な怪談の紹介や、パブリックドメイン作品の案内を扱います。創作との混同を避けて掲載します。",
  },
  {
    slug: "kids",
    label: "子ども向け怪談",
    description:
      "過度な残酷描写を避け、学校や家庭で語れる不思議さ中心の怪談を集めます。",
  },
];

export const settings: TaxonomyItem[] = [
  { slug: "home", label: "家", description: "もっとも安全なはずの場所で、生活音や家族の気配が少しずつ変わる怪談です。" },
  { slug: "apartment", label: "集合住宅", description: "隣室、上階、共用廊下、管理掲示板など、近い他人の気配が怖さになる作品です。" },
  { slug: "school", label: "学校", description: "教室、体育館、放課後の廊下、部活動の記録に残る学校怪談です。" },
  { slug: "hospital", label: "病院", description: "病室、ナースステーション、検査室など、生死の境目に近い場所の怪談です。" },
  { slug: "workplace", label: "職場", description: "オフィス、倉庫、夜勤、社内チャットなど、働く場所に潜む怖さを扱います。" },
  { slug: "hotel", label: "ホテル", description: "一時的な部屋、知らない寝具、清掃記録などから始まる怪談です。" },
  { slug: "mountain", label: "山", description: "登山道、林道、峠、山小屋など、人の気配が薄い場所の怪談です。" },
  { slug: "sea", label: "海", description: "浜辺、港、防波堤、潮の音にまつわる怪談です。" },
  { slug: "river", label: "川", description: "河川敷、橋、水音、流れてくるものを題材にした怪談です。" },
  { slug: "tunnel", label: "トンネル", description: "抜けるまで戻れない暗い道と、反響する音が中心になる怪談です。" },
  { slug: "road", label: "道路", description: "夜道、交差点、車内、ドライブレコーダーに残る怪談です。" },
  { slug: "train", label: "駅・電車", description: "終電、無人駅、車内アナウンスなど移動中に逃げ場がなくなる怪談です。" },
  { slug: "shrine-temple", label: "神社・寺", description: "信仰、禁足地、古い札や祠に触れる怪談です。" },
  { slug: "ruins", label: "廃墟", description: "使われなくなった建物に残る生活の跡と侵入者の不安を扱います。" },
  { slug: "web", label: "インターネット", description: "ブラウザ、チャット、投稿履歴、AI応答など画面の向こう側の怪談です。" },
  { slug: "countryside", label: "田舎", description: "集落、古い家、土地の決まり、よそ者への沈黙が怖さになる怪談です。" },
  { slug: "city", label: "都市部", description: "人が多いのに孤立する、駅前や繁華街やマンション群の怪談です。" },
];

export const lengthTypes: TaxonomyItem[] = [
  { slug: "one-minute", label: "1分怪談", description: "休憩中や移動中に読める、ごく短い怪談です。" },
  { slug: "short", label: "短編", description: "短時間で読み切れる、余韻重視の怪談です。" },
  { slug: "medium", label: "中編", description: "人物や状況を少し深く追える、読み応えのある怪談です。" },
  { slug: "long", label: "長編", description: "複数場面や記録形式を含む、本当に怖い長めの怪談です。" },
];

export const fearLevels: FearLevel[] = [
  { level: 1, label: "レベル1：不思議", description: "怖さよりも不可思議さが残る入門向けです。" },
  { level: 2, label: "レベル2：ほんのり怖い", description: "夜に思い出す程度の軽い怖さです。" },
  { level: 3, label: "レベル3：じわじわ怖い", description: "読み終えてから意味が染みてくる怖さです。" },
  { level: 4, label: "レベル4：かなり怖い", description: "緊張感や危険の接近が強い作品です。" },
  { level: 5, label: "レベル5：閲覧注意", description: "後味の悪さや強い恐怖を含む作品です。" },
];

export const endingTypes: TaxonomyItem[] = [
  { slug: "bad-aftertaste", label: "後味が悪い", description: "解決しても嫌な感触が残る結末です。" },
  { slug: "twist", label: "どんでん返し", description: "最後に状況の意味が反転する結末です。" },
  { slug: "unresolved", label: "未解決", description: "原因や正体が分からないまま終わります。" },
  { slug: "survival", label: "生還", description: "危険から逃げ延びた語りとして終わります。" },
  { slug: "karma", label: "因果応報", description: "行動の報いとして怪異や破滅が訪れます。" },
  { slug: "unknown", label: "正体不明", description: "幽霊とも人間とも断定できないものが残ります。" },
  { slug: "explained", label: "解説あり", description: "読後に意味や伏線を確認できます。" },
  { slug: "series-continues", label: "シリーズ継続", description: "同じ人物や場所の続きがあります。" },
];

export function findByLabel(items: TaxonomyItem[], label: string) {
  return items.find((item) => item.label === label);
}

export function findCategoryByLabel(label: string) {
  return findByLabel(mainCategories, label);
}

export function findSettingByLabel(label: string) {
  return findByLabel(settings, label);
}

export function findLengthByLabel(label: string) {
  return findByLabel(lengthTypes, label);
}
