# Token architecture (reference)

Three tiers, enforced by `token-audit.mjs`:

## Tier 1 — reference tokens (`src/styles/themes.css`, `--t-*`)

Raw values. A theme is one block of Tier-1 tokens, selected via
`<html data-theme="...">`:

- `--t-accent`, `--t-on-accent` — brand accent + text/foreground on it
- `--t-bg` — page background; `--t-surface` — card/panel;
  `--t-surface-alt` — recessed/alternate surface
- `--t-text`, `--t-text-muted` — primary + secondary text
- `--t-border` — hairlines and dividers
- `--t-overlay` — modal/zoom scrim (theme-tinted near-black, 88% alpha)
- `--font-display`, `--font-body`, `--font-mono` — type stacks
- `--measure` — max line length for prose (current: 72ch)

Current themes: `ferra` (default, also the `:root` fallback), `slate`, `ink`.
Dark mode is a separate set of blocks (a generic `[data-mode="dark"]` block
plus theme-specific overrides) — see the file for the cascade.

**Adding a theme:** add a Tier-1 block for light in `themes.css`, register its
name in `src/data/themes.mjs` (the single source of truth for the theme list,
read by the dev `ThemeToggle` and the screenshot tooling), verify the generic
dark block reads against it, add a theme-specific dark block only if the
generic one fails contrast, then run the full screenshot matrix + audit.

## Tier 2 — semantic tokens (`src/styles/global.css`)

`:root` maps Tier-1 to meaning: `--bg`, `--surface`, `--surface-alt`,
`--text`, `--text-muted`, `--border`, `--accent`, `--on-accent`, `--overlay`, plus
the font and measure tokens. Components and component styles use **only** these names.
This seam is what lets a theme (or the dark axis) restyle the whole site
without touching components.

## Tier 3 — component tokens

Component-level custom properties where a component needs a local knob
(keep rare; prefer Tier-2).

## The dark/light axis

`data-mode="light|dark"` (and `"auto"`, resolved by the inline script in
`Base.astro` via `prefers-color-scheme`). Dark overrides the *meaning* of
surfaces, not the accent; accents are lightened for dark backgrounds. Never
model dark as a separate "theme" in component CSS.

## Screenshotting specific theme/mode

The built page defaults to `data-theme="ferra" data-mode="auto"`. To capture
a specific combination, set the attributes on `<html>` after load and before
capturing (attribute selectors re-resolve instantly). `screenshot.mjs` does
this for you.

## Gotchas

- **Global CSS is unscoped by design (fixed 2026-08-20).** `global.css` and
  `themes.css` are `@import`ed inside `Base.astro`'s `<style is:global>` tag,
  so element rules apply to ALL page content, not just the layout's own
  markup. Do NOT drop `is:global` — without it Astro scopes every element
  selector to the layout's scope id and page content (links, headings, lists,
  code) silently falls back to UA defaults.
- Fonts load from the system/Google stack in the Tier-1 font tokens; wait for
  `document.fonts.ready` before capturing or metrics will lie.
- The dev `ThemeToggle` (floating control, bottom-right) is rendered only in
  DEV builds via `import.meta.env.DEV` in `Base.astro`, so it is tree-shaken
  out of production and never appears in screenshots of `dist/`. It is
  future-proof: buttons are generated from `src/data/themes.mjs`, so new
  themes appear there automatically.
- Print styles live in `src/styles/print.css` (intentional exception to the
  color rules — it styles the generated résumé PDF).
