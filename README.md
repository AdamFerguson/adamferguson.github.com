# adamferguson.github.com

Personal site for **Adam Ferguson** — home page, a data-driven résumé, and a
Markdown blog. Built with [Astro](https://astro.build) and deployed to GitHub
Pages.

## Quick start

```bash
npm install
npm run dev          # start the dev server (http://localhost:4321)
npm run build        # production build → dist/
npm run preview      # serve the production build locally
```

## What's where

| Path                     | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `src/data/resume.yaml`   | **Résumé source of truth** (JSON Resume schema, YAML) |
| `src/data/site.mjs`      | Site metadata, navigation, social links              |
| `src/content/blog/`      | Blog posts (one Markdown file each)                  |
| `src/layouts/Base.astro` | Global layout (header, footer, theme, styles)        |
| `src/pages/`             | Routes: `/`, `/resume/`, `/blog/`, `/about/`, etc.   |
| `src/styles/`            | Design tokens (`themes.css`) + global + print CSS    |
| `public/`                | Static assets: favicon, images, generated résumé PDF |
| `scripts/`               | Build/pipeline helpers (see below)                   |
| `.github/workflows/`     | GitHub Actions: build + deploy to Pages              |

## The résumé

The résumé is a **single YAML file** (`src/data/resume.yaml`) validated against
the [JSON Resume schema](https://jsonresume.org). It drives:

- the `/resume/` page,
- the home-page "Current focus" summary,
- the Person JSON-LD structured data,
- the generated PDF (`public/AdamFerguson-Resume.pdf`), and
- (optionally) a Word document.

### Update the résumé

1. Edit `src/data/resume.yaml` (keep it valid JSON Resume data — see
   [schema](https://github.com/jsonresume/resume-schema)).
2. Validate: `npm run validate:resume`
3. Rebuild the PDF: `npm run pdf`
4. Commit. CI validates the YAML and regenerates the PDF on every deploy.

> The PDF is **not** committed to git — it's generated in CI from the
> `/resume/` page so it always matches the web view (WYSIWYG).

### Regenerate the PDF locally

```bash
npm run build        # (or rely on an existing dist/)
npm run pdf          # builds if needed, then renders via Playwright
```

Requires Playwright's Chromium: `npx playwright install chromium`.

## The blog

Posts are plain Markdown files in `src/content/blog/`. The **filename is the
URL slug** (e.g. `my-post.md` → `/blog/my-post/`).

Front matter:

```yaml
---
title: "My post"
description: "A one-line summary shown on index + home."
date: 2026-08-19
tags: [astro, meta]
category: Engineering   # optional
draft: false            # omit to keep the post published
---
```

- **New post:** add a file to `src/content/blog/`, commit, push.
- **Tags / categories:** derived from front matter; indexed at `/tags/` and
  `/categories/`.
- **RSS:** `/feed.xml` (the old `/atom.xml` redirects here).
- **Drafts:** set `draft: true` to exclude from the site and feed.

## Theming

Design tokens live in `src/styles/`:

- `themes.css` — Tier-1 *reference* tokens. Each theme (`ferra`, `slate`,
  `ink`) is a set of `--t-*` values, selected via `<html data-theme="...">`.
- Dark/light is an **orthogonal** axis (`data-mode`), not a theme.
- `global.css` — maps reference → semantic → component tokens + layout.
- `print.css` — `@media print` rules used for the résumé PDF.

### Trying themes (dev only)

A small floating theme switcher appears in the dev server (`npm run dev`)
bottom-right. It writes your choice to `localStorage`
(`af-theme`, `af-mode`) and is **disabled in production builds**. To preview a
specific theme, set the `data-theme` / `data-mode` attributes in
`src/layouts/Base.astro` (the `theme` / `mode` consts), or use the dev toggle.

## Deployment

Deploys to **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`):

- Validates the résumé YAML.
- Builds the site.
- Renders the résumé PDF with Playwright.
- Uploads `dist/` as the Pages artifact and deploys on `master`/`main`.

**Required repo settings** (one-time, in the GitHub UI):
1. *Settings → Pages → Build and deployment → Source:* **GitHub Actions**.
2. *Settings → Pages → Custom domain:* `adam-ferguson.com`, with **Enforce
   HTTPS** on. (Point the DNS CNAME at `adamferguson.github.com`.)

The primary domain is `adam-ferguson.com`; `adamferguson.github.com` is an
automatic alias.

## Legacy URL redirects

Old Jekyll URLs are preserved via client-side redirect pages generated in
`public/` by `scripts/make-redirects.mjs` (e.g. `/about.html` → `/about/`,
`/atom.xml` → `/feed.xml`, legacy posts → `/blog/`). Re-run it after adding
redirects: `node scripts/make-redirects.mjs`.

## Project layout notes

- Analytics: Cloudflare Web Analytics (cookieless, same-vendor as hosting).
  The beacon tag is injected at build time from the `CF_WEB_ANALYTICS_TOKEN`
  CI secret — local builds contain no beacon, and no secrets exist in this
  repo.
- Minimal runtime JS: a tiny pre-paint theme hydrator, the deferred
  Cloudflare analytics beacon, and the dev-only theme toggle.
- `docs/plan.md` and `docs/planning-prompts.md` hold the approved plan and the
  original planning prompts/research.
