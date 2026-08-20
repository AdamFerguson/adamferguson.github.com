---
name: website-design
description: Design and restyling work for the Adam Ferguson personal site (Astro, static). Use when designing, theming, redesigning, restyling, or reviewing the look of any page or component in this repository — including theme work, typography, spacing, color, and visual QA.
---

# Website Design

Design workflow for this repo. The aesthetic contract is `DESIGN.md` at the
repo root; the token contract is the three-tier architecture documented in
[references/token-architecture.md](references/token-architecture.md).

## Workflow (every design task, no matter how small)

1. **Read the brief.** `DESIGN.md` first. If it is marked DRAFT and the task
   depends on taste direction, say so explicitly and proceed with the
   structural rules only.
2. **Read the architecture.** [references/token-architecture.md](references/token-architecture.md)
   before touching any CSS.
3. **Baseline.** For the pages you will touch, run:
   ```bash
   node .pi/skills/website-design/scripts/token-audit.mjs
   ```
   and capture the affected pages (`screenshot` tool or `--quick`) and
   `read` the produced PNGs. Know what "before" looks like.
4. **Implement.** Tokens first, components second. Never hardcode a value a
   token already expresses.
5. **Verify, in this order:**
   ```bash
   npm run check                                  # build + résumé validation
   node .pi/skills/website-design/scripts/token-audit.mjs
   ```
   then capture: `theme_matrix` when the change touched color/surface/type or
   a theme, otherwise `screenshot` for the changed pages. `read` the new
   screenshots and critique them against DESIGN.md and
   [references/review-checklist.md](references/review-checklist.md). Screenshots
   are verification evidence, not the spec — the spec is the brief + tokens.
6. **Iterate** until the checklist passes and `npm run check` is green. Report
   the result with the output directory of the final screenshot run.

## Screenshot tools (fully headless, no human in the loop)

Capture is available two ways — prefer the extension tools when they are in
your tool list, otherwise run the node script via `bash`:

- `screenshot` (extension tool) — quick/iterative capture: default theme,
  light+dark, 1440px, key pages. Optional `pages`, `themes`, `modes`,
  `viewports`, `skipBuild`.
- `theme_matrix` (extension tool) — full matrix: every theme in
  `themes.css` × light+dark × viewports. Use for any change touching color,
  surface, or type, and for theme evaluation.

Both wrap `scripts/screenshot.mjs`, which builds the site, serves `dist/` on a
random localhost port, drives headless Chromium (Playwright, already a dev
dependency), and tears everything down. Output lands in `design-shots/<ts>/`
with a `manifest.json` mapping each PNG to page/theme/mode/viewport.

```bash
# direct-script equivalents
node .pi/skills/website-design/scripts/screenshot.mjs --quick
node .pi/skills/website-design/scripts/screenshot.mjs            # default matrix
node .pi/skills/website-design/scripts/screenshot.mjs --all-themes
node .pi/skills/website-design/scripts/screenshot.mjs --pages /,/blog/ --skip-build
```

First use may need: `npx playwright install chromium` (the script prints this
if the browser is missing).

**The agent must view its own output.** After every capture, `read` the PNGs
(they are attached to the model as images) before claiming a design is done.
The active default model is vision-capable (owner-confirmed 2026-08-20); if a
future model cannot see images, stop and say so — fall back to the
deterministic checks (audit + build) and request a visual review from a
vision-capable model or the owner.

## Token audit (deterministic gate)

```bash
node .pi/skills/website-design/scripts/token-audit.mjs
```

Reports: (1) raw colors found outside `themes.css`, (2) Tier-1 token leaks
into components, (3) unevaluated JS calls in built attributes (`dist/` HTML,
e.g. `href="url(item.href)"` from a backtick-wrapped template literal),
(4) WCAG contrast for every theme × mode pair. Exit code 1 on hard
failures. Run it before *and* after any CSS work — it needs a fresh build
for the dist/ scan.

## When to stop and ask the owner

- Any taste-direction question while DESIGN.md is DRAFT.
- Changing the theme selection (Section 3 of DESIGN.md).
- Anything that would touch `public/` legacy redirects or résumé data.
