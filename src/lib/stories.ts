import { getCollection, type CollectionEntry } from "astro:content";

export type Story = CollectionEntry<"stories">;

export async function getPublishedStories() {
  const stories = await getCollection("stories", ({ data }) => data.reviewStatus === "published");
  return stories.sort((a, b) => {
    const publishedDiff = b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
    if (publishedDiff !== 0) return publishedDiff;
    return a.data.title.localeCompare(b.data.title, "ja");
  });
}

export function storyPath(story: Story) {
  return `/stories/${story.data.slug}/`;
}

export function categoryPath(slug: string) {
  return `/categories/${slug}/`;
}

export function tagPath(slug: string) {
  return `/tags/${slug}/`;
}

export function seriesPath(slug: string) {
  return `/series/${slug}/`;
}

export function slugifyLabel(label: string) {
  return label
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function relatedStories(current: Story, stories: Story[], limit = 4) {
  return stories
    .filter((story) => story.id !== current.id)
    .map((story) => {
      let score = 0;
      if (story.data.mainCategory === current.data.mainCategory) score += 4;
      score += story.data.setting.filter((item) => current.data.setting.includes(item)).length * 3;
      score += story.data.tags.filter((item) => current.data.tags.includes(item)).length * 2;
      if (story.data.lengthType === current.data.lengthType) score += 1;
      if (story.data.fearLevel === current.data.fearLevel) score += 1;
      if (story.data.series && story.data.series === current.data.series) score += 5;
      return { story, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.story.data.publishedAt.getTime() - a.story.data.publishedAt.getTime())
    .slice(0, limit)
    .map((item) => item.story);
}

export function adjacentStories(current: Story, stories: Story[]) {
  const ordered = [...stories].sort((a, b) => a.data.publishedAt.getTime() - b.data.publishedAt.getTime());
  const index = ordered.findIndex((story) => story.id === current.id);
  return {
    previous: index > 0 ? ordered[index - 1] : undefined,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined,
  };
}

export function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}
