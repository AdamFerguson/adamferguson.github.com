---
title: "Moving this site to Astro"
description: "Why this personal site is moving from Jekyll to Astro, and what that means for the résumé, the blog, and the URLs."
date: 2026-08-19
tags:
  - astro
  - static-site
  - meta
category: Engineering
---

For years this site has been a small Jekyll-Bootstrap setup: a few posts, a
hand-built résumé, and a lot of legacy scaffolding. It worked, but it was
hard to extend and slow to change.

This is a first post on the rebuilt version. A few things to note:

- The résumé is now data-driven — a single YAML file that renders the page,
  the PDF, and (eventually) a Word document.
- The blog is plain Markdown in this repo, with tags, categories, and an RSS
  feed at `/feed.xml`.
- The old URLs still redirect, so anything you've bookmarked should land in
  the right place.

More posts on the things I'm building along the way.
