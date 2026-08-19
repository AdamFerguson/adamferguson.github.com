// RSS feed endpoint at /feed.xml (old /atom.xml redirects here).
// A pure module (no Astro frontmatter) — Astro routes by the GET export.
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { site } from "../data/site.mjs";
import { slugOf } from "../utils/url.mjs";

export async function GET(context) {
  const posts = await getCollection("blog");
  return rss({
    title: site.title,
    description: site.description,
    site: context.site,
    items: posts
      .filter((p) => !p.data.draft)
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/blog/${slugOf(post.id)}/`,
        categories: [
          ...(post.data.tags ?? []),
          ...(post.data.category ? [post.data.category] : []),
        ],
      })),
  });
}
