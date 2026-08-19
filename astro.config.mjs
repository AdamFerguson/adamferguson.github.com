import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import yaml from "@rollup/plugin-yaml";

// Enable import of .yaml files (used by src/data/resume.yaml).
const yamlPlugin = () => yaml();

// Site base URL. In production this is the primary custom domain.
// Override with SITE_URL env var (used by CI for preview builds).
const site = process.env.SITE_URL || "https://adam-ferguson.com";

// Preview builds are served from a sub-path (e.g. /preview/pr-123).
// Production uses "/" (root).
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "ignore",
  // Astro v7 changed the default `compressHTML` from `true` (HTML-aware
  // whitespace) to `'jsx'` (JSX-style, which can glue adjacent inline text
  // together). Keep the HTML-aware behavior so spaces between inline
  // elements render as expected.
  compressHTML: true,
  integrations: [
    sitemap({
      // Only include index pages + blog posts in the sitemap.
      filter: (page) =>
        !page.startsWith(base + "/tags/") &&
        !page.startsWith(base + "/categories/"),
    }),
  ],
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    plugins: [yamlPlugin()],
  },
});
