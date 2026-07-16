import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";
import { getPublishedStories, storyPath } from "../lib/stories";

export const GET: APIRoute = async (context) => {
  const stories = await getPublishedStories();
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site?.toString() || siteConfig.url,
    items: stories.map((story) => ({
      title: story.data.title,
      description: story.data.excerpt,
      pubDate: story.data.publishedAt,
      link: storyPath(story),
    })),
  });
};
