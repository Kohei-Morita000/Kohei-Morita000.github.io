import { defineCollection, z } from "astro:content";

const sourceTypes = [
  "original",
  "user-submission",
  "public-domain",
  "legend-explanation",
  "licensed",
] as const;

const reviewStatuses = [
  "draft",
  "ai-generated",
  "checked",
  "edited",
  "approved",
  "published",
  "rejected",
] as const;

const stories = defineCollection({
  type: "content",
  schema: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    excerpt: z.string().min(20).max(180),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    author: z.string().min(1),
    mainCategory: z.string().min(1),
    subCategories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    setting: z.array(z.string()).default([]),
    fearLevel: z.number().int().min(1).max(5),
    lengthType: z.enum(["1分怪談", "短編", "中編", "長編"]),
    estimatedReadingMinutes: z.number().int().min(1).max(90),
    endingType: z.array(z.string()).default([]),
    series: z.string().nullable().optional(),
    episodeNumber: z.number().int().positive().nullable().optional(),
    featured: z.boolean().default(false),
    editorialScore: z.number().int().min(0).max(100).default(0),
    contentWarning: z.array(z.string()).default([]),
    sourceType: z.enum(sourceTypes),
    aiAssisted: z.boolean().default(false),
    reviewStatus: z.enum(reviewStatuses),
    seoTitle: z.string().min(1).max(70),
    seoDescription: z.string().min(50).max(160),
  }),
});

export const collections = { stories };
