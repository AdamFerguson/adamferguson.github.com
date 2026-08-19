// Shared URL helper.
//
// In this Astro version `Astro.base` is `undefined` at build time, which would
// produce "undefined/path" hrefs. The site deploys at the domain root, so the
// base path is "" (empty). If a sub-path base is ever needed (e.g. a preview
// under /preview/), set SITE_BASE_PATH and it's used here.
const base = process.env.SITE_BASE_PATH || "";

export function url(path) {
  const p = path.startsWith("/") ? path : "/" + path;
  return base + p;
}

// Strip a trailing ".md" (or other file extension) from a content-layer id
// so blog URLs are clean: /blog/my-post/ instead of /blog/my-post.md/.
export function slugOf(id) {
  return id.replace(/\.[a-z0-9]+$/i, "");
}
