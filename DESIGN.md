# DESIGN.md — Design brief for adamsferguson.github.com

**Status: Taste direction FINAL (2026-08-20).** The structural/token rules
below are the active contract. The theme pick (Section 3) is the one open item.

This file is the single source of truth for what the site should look like and
how the design agent should reason about it. The `website-design` skill
(`.pi/skills/website-design/`) enforces the workflow against this brief.

## 0. What the site is

A personal site for a working software engineer: home page, a data-driven
résumé (YAML → HTML/PDF/DOCX), and a Markdown blog. Audience: hiring managers,
colleagues, and fellow engineers. The site should read as **the work of a
specific, discerning engineer** — not a template.

Content constraints that design must respect:
- No analytics, no tracking, no third-party scripts (privacy is a feature).
- Legacy URLs must keep working (redirects in `public/`).
- The résumé PDF/DOCX are generated from the built page; print CSS matters.

## 1. Taste direction (FINAL — chosen by the owner, 2026-08-20)

The default failure mode of AI-generated UI is *distributional convergence*:
the statistical average of the training data (Inter + purple gradient +
centered hero + 3-up feature cards). Everything in this section exists to
break that.

### "I like" references

Primary (weight these most — the site is a personal site / blog / résumé):

- **overreacted.io** — warm, minimal, strong personal voice. The model for the
  blog half: prose-first, quiet chrome, little that isn't earning its place.
- **anthropic.com** — clean, warm paper tones, editorial calm, quiet
  confidence, high type quality. The model for the overall feel.

Secondary (borrow polish, not identity):

- **linear.app** — precision and restraint in detail work: consistent
  spacing, subtle depth, disciplined type hierarchy.

What that combination means in practice: warm and human, not corporate or
tech-futurist; prose and type carry the design; accent is used sparingly as
signal; surfaces are calm (no glow, no gradient, no glass).

### Baseline "I dislike" (confirmed by the owner)

- Generic AI slop: Inter + purple gradient + centered hero + 3-up feature cards
- Glassmorphism and heavy blurred overlays
- Dark neon "hacker" aesthetics (glowing accents everywhere)
- Default Tailwind blue, stock Bootstrap/Element-UI colors
- Motion for its own sake (parallax, hero animations) — this site is a
  document, not a product launch

## 2. Design system contract (machine-enforced)

The site uses a three-tier token architecture — this is the *executable
contract* and the `token-audit` script checks it:

- **Tier 1 — reference tokens** (`--t-*`, `src/styles/themes.css`): raw
  palette/typography values. A theme is a set of Tier-1 tokens. **The only
  place raw hex values belong.**
- **Tier 2 — semantic tokens** (`--bg`, `--text`, `--accent`…,
  `src/styles/global.css`): theme-independent meanings. Components may only
  use these.
- **Tier 3 — component tokens**: used inline by components.
- **Dark/light is an orthogonal axis** (`data-mode`), layered on top of the
  theme (`data-theme`). Adding a mode must not fork every theme's palette.

Hard rules (violations are flagged by `.pi/skills/website-design/scripts/token-audit.mjs`):

1. No raw hex/rgb/hsl colors anywhere in `src/` except `styles/themes.css`
   (and `print.css`, which is print-only and reviewed manually).
2. Components (`.astro` files) must not reference Tier-1 tokens
   (`var(--t-…)`); they use semantic tokens.
3. New themes are added as new Tier-1 blocks in `themes.css` plus any
   theme-specific dark overrides — never by editing component CSS.
4. Color pairs must meet WCAG: ≥ 4.5:1 for text roles, ≥ 3.0:1 for
   accent-on-surface UI usage. `token-audit` computes and reports these.

### Known defects (found by the tooling, 2026-08-20 — all FIXED 2026-08-20)

1. **Global CSS is Astro-scoped.** `global.css` is imported through the
   `<style>` tag in `Base.astro`, so Astro scopes every element selector to
   the layout's own scope id (e.g. `h2[data-astro-cid-…]`,
   `a[data-astro-cid-…]`). Page content (all `<main>` content) carries the
   page's scope id, so the global element rules — links, headings, lists,
   code — silently do not apply to it. Evidence: built links compute to the
   UA default `rgb(0,0,238)` + underline instead of `var(--accent)`, and
   styled `h2`s render as UA defaults. Fix direction: make these styles truly
   global (`is:global` on the layout style, or serve the CSS unscoped) and
   re-verify with the screenshot matrix. **FIXED 2026-08-20:** the layout
   `<style>` in `Base.astro` now uses `is:global`, so the imported sheets
   (themes/global/print) ship unscoped; verified in built `dist` CSS
   (element selectors carry no `data-astro-cid`) and in the screenshot
   matrix (links use `--accent`, headings/lists/code use the global rules).
2. **slate/ink have no font tokens.** Only the ferra block defines
   `--t-font-display/--t-font-body/--t-font-mono`; the self-referential
   fallbacks in `global.css` then resolve to nothing, so slate and ink render
   in the browser default serif. The full theme matrix shows it: ferra is
   sans-serif, slate/ink are Times-like. **FIXED 2026-08-20:** all three
   themes now define `--t-font-display/--t-font-body/--t-font-mono` in
   `themes.css` (system stacks only; slate = clean corporate sans, ink =
   mono display + clean sans body). The ferra block's tokens were renamed to
   the canonical `--t-` names and `global.css` maps them with
   non-self-referential fallbacks.
3. **ferra light accent contrast:** `on-accent` on `accent` = 3.6:1 (fails
   4.5 for normal text) — flagged by `token-audit`. **FIXED 2026-08-20:**
   `--t-accent` darkened `#d96524` → `#b84e17` (deeper burnt orange, warm
   editorial character retained); `on-accent` on `accent` now 5.07:1,
   accent-on-bg 4.62:1. ferra dark (6.86:1) untouched and still passing.

These defects are closed; the screenshot matrix + audit are the verification
record. Any recurrence should be re-recorded here.

## 3. Theme status

Candidate themes exist in `src/styles/themes.css`:

- **ferra** — warm, editorial (burnt orange on warm paper). **THE THEME**.
- **slate** — cool, corporate-technical (teal on cool paper). Alternate.
- **ink** — minimal, mono-accented, high-contrast. Alternate.

**Decision (2026-08-20): ferra is the permanent theme.** It matches the
taste direction (warm, editorial, quiet) and the owner confirmed the pick.
The others stay available for the dev theme toggle and the screenshot
matrix. (Default is set in `src/data/themes.mjs`.)

## 4. Verification workflow (summary)

Full procedure lives in `.pi/skills/website-design/SKILL.md`. The loop is:

1. Read this brief + token architecture reference.
2. Baseline: `token-audit` + screenshot matrix of the affected pages.
3. Implement (tokens → components, never the reverse).
4. Verify: `npm run check` (build + résumé validation) → `token-audit` →
   screenshot matrix → visual critique against this brief and the review
   checklist.
5. Iterate until the checklist passes; report shot paths with the result.

Capture can be run via the extension tools (`screenshot`, `theme_matrix`) when
available, or via the node scripts directly.

## 5. Model note

The default working model is vision-capable (owner-confirmed 2026-08-20):
screenshots can be read and critiqued by the agent directly. If a future
model swap drops vision, the workflow's fallback (deterministic checks only,
state the limitation) applies — see the skill.

## 6. Change log

- 2026-08-21: Figure images zoom on click (medium-zoom 1.1.0, MIT, ~3.7 kB,
  bundled locally — no CDN, no runtime third-party requests). Theme-aware
  scrim via new Tier-1 `--t-overlay` (per-theme warm/cool/neutral near-black).
  Added focus management (into the zoomed image on open, back to the figure
  on close) and keyboard support (figure images are focusable; Enter/Space
  opens) — neither exists in medium-zoom. Do NOT zero these transitions
  under prefers-reduced-motion: the library finalizes cleanup on
  transitionend, which never fires for 0s/none transitions. Figcaption now
  small + muted + `--font-mono` so captions read as annotations.
- 2026-08-20: Dev-only `ThemeToggle` wired into `Base.astro` (tree-shaken in
  production); theme list centralized in `src/data/themes.mjs` so the toggle
  and screenshot tooling discover new themes automatically. Orphaned
  `public/scripts/theme-toggle.js` removed.
- 2026-08-20: All three known defects fixed. (1) `Base.astro` layout
  `<style>` set to `is:global` so element-level rules apply to page content.
  (2) `--t-font-display/--t-font-body/--t-font-mono` added to slate and ink
  in `themes.css` (ferra's font tokens renamed to the `--t-` names; the
  self-referential `global.css` fallbacks replaced with plain system-stack
  fallbacks). (3) ferra light `--t-accent` darkened `#d96524` → `#b84e17`
  so `on-accent` on `accent` = 5.07:1 (≥4.5). Verified: `npm run check`
  green, `token-audit` exit 0, full 96-shot matrix at
  `design-shots/2026-08-20T17-34-39/`.
- 2026-08-20: Theme matrix (96 shots) captured; three known defects recorded
  (global CSS scoping, missing slate/ink font tokens, ferra accent contrast).
- 2026-08-20: Taste direction finalized by the owner — overreacted.io and
  anthropic.com primary, linear.app secondary; dislike baseline confirmed.
- 2026-08-20: Initial draft; taste references proposed for owner selection.
