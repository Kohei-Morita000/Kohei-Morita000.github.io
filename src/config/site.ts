export const siteConfig = {
  name: "闇語り文庫",
  shortName: "闇語り",
  description:
    "短い怖い話から長編怪談、意味が分かると怖い話まで、恐怖の種類・舞台・長さで探せる怪談ライブラリーです。",
  url: import.meta.env.PUBLIC_SITE_URL || "https://example.com",
  author: "闇語り文庫編集部",
  locale: "ja_JP",
  defaultOgImage: "/og.png",
  contactEmail: "contact@example.com",
};

export function withBase(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(cleanPath, new URL(base, siteConfig.url)).toString();
}

export function absoluteUrl(path: string) {
  return withBase(path);
}
