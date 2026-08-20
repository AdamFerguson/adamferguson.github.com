# Anti-patterns (named "don'ts")

Vague "make it better" instructions produce the training-data average. These
are the specific things to refuse, detect, or fix. Each has a rule you can
state in a diff review.

## Generic AI UI
- **Inter-everywhere + purple gradient + centered hero + 3-up feature cards.**
  This site is a personal site, not a SaaS landing page. No "feature" cards,
  no CTA banners, no gradient meshes.
- **Centered-hero-by-default.** If a section is centered, it must be a
  deliberate composition choice (e.g., a single statement), not a fallback.
- **Symmetric feature grids on a blog.** The blog is a document: lists,
  reading measure, quiet chrome.

## Color
- Raw hex/rgb/hsl in `src/` outside `themes.css` (audit-flagged).
- Default framework blues, stock Tailwind palette values, or purple-by-default
  accents.
- Accent used for decoration (underlines, backgrounds, glows) rather than
  signal (links, active states, emphasis).
- Text on accent that isn't `--on-accent`.

## Theme discipline
- Tier-1 tokens (`--t-*`) referenced from `.astro` components.
- Dark mode implemented by forking theme palettes in component CSS instead of
  the `data-mode` axis.
- A new theme that special-cases components instead of supplying complete
  Tier-1 values.

## Typography & layout
- Prose wider than `--measure`.
- More than two typefaces visible on one screen.
- Line heights under 1.4 for body text, or font-size steps that don't follow a
  consistent scale.
- Pixel-tight spacing (4px gaps, 1px padding) where the design needs breathing
  room; spacing should come from a small set of consistent steps.

## Effects & motion
- Glassmorphism, heavy blur, glowing neon accents.
- Motion that does not carry information (decorative parallax, hero
  animations). Honor `prefers-reduced-motion` — the base layout already does.

## Accessibility (non-negotiable)
- Text below 4.5:1 contrast (or 3.0:1 for accent UI usage) — audit-flagged.
- Links/controls indistinguishable from text except by color alone.
- Missing visible focus states.

## Process anti-patterns
- "Looks fine" without having viewed the screenshots of the changed pages.
- Changing a component's visual without checking all three themes in both
  modes when the change touches color/surface.
- Editing `public/` legacy files or résumé data as a design change.
