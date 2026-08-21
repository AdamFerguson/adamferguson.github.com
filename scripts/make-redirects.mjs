#!/usr/bin/env node
// Generate legacy-URL redirect pages in public/. Each is a tiny HTML file
// that issues a client-side 301 (meta refresh) to the new location. GitHub
// Pages serves these as static files, so old bookmarked/linked URLs keep
// working after the Jekyll → Astro migration.
//
// Run with: node scripts/make-redirects.mjs  (idempotent)
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "public");

// Legacy URL -> new destination. Keys are the old paths (no leading slash
// needed; they become public/<key>/index.html or public/<key>.html).
const redirects = [
  // Pages
  ["about.html", "/about/"],
  ["archive.html", "/blog/"],
  ["tags.html", "/tags/"],
  ["categories.html", "/categories/"],
  ["pages.html", "/blog/"],
  // Feeds / sitemap (old paths)
  ["atom.xml", "/feed.xml"],
  ["sitemap.txt", "/sitemap-index.xml"],
  // Legacy blog posts (dropped content; send readers to the blog index).
  [
    "learning/2012/01/31/learning-markdown",
    "/blog/",
  ],
  [
    "lessons/2011/12/29/jekyll-introduction",
    "/blog/",
  ],
];

function page(dest) {
  return (
    `<!doctype html>\n<html lang="en">\n<head>\n` +
    `<meta charset="utf-8" />\n` +
    `<meta http-equiv="refresh" content="0; url='${dest}'" />\n` +
    `<title>Moved</title>\n` +
    `<link rel="canonical" href="${dest}" />\n` +
    `</head>\n<body>\n` +
    `<p>This page has <a href="${dest}">moved</a>.</p>\n` +
    `</body>\n</html>\n`
  );
}

let count = 0;
for (const [from, dest] of redirects) {
  // A path ending in .html -> public/<from> (a file).
  // Otherwise -> public/<from>/index.html (a directory).
  let target;
  if (from.endsWith(".html") || from.endsWith(".xml") || from.endsWith(".txt")) {
    target = join(OUT, from);
  } else {
    target = join(OUT, from, "index.html");
  }
  mkdirSync(dirname(target), { recursive: true });
  if (!existsSync(target)) {
    writeFileSync(target, page(dest));
    count++;
    console.log(`+ ${from} -> ${dest}`);
  }
}
console.log(`Wrote ${count} redirect page(s).`);
