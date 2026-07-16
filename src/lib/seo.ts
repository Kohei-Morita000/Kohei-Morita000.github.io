import type { Story } from "./stories";
import { absoluteUrl, siteConfig } from "../config/site";
import { storyPath } from "./stories";
import { toIsoDate } from "./date";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    inLanguage: "ja",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search/")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function collectionJsonLd(title: string, path: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: absoluteUrl(path),
    description,
    inLanguage: "ja",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/"),
    },
  };
}

export function articleJsonLd(story: Story) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.data.title,
    description: story.data.excerpt,
    datePublished: toIsoDate(story.data.publishedAt),
    dateModified: toIsoDate(story.data.updatedAt),
    author: {
      "@type": "Person",
      name: story.data.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    mainEntityOfPage: absoluteUrl(storyPath(story)),
    inLanguage: "ja",
    articleSection: story.data.mainCategory,
    keywords: story.data.tags.join(", "),
  };
}
