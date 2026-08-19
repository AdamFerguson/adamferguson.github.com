import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog posts: one Markdown file per post in src/content/blog/.
// The filename (minus extension) becomes the URL slug, so URLs are
// predictable and stable: /blog/{slug}/.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    draft: z.boolean().default(false),
    // Allow legacy front-matter keys without breaking the build.
    // "category" is singular here; treat as the primary category.
  }),
});

export const collections = { blog };
