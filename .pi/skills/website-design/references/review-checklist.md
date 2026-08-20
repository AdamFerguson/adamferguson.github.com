# Review checklist (definition of "done" for a design change)

Run after implementation, before reporting. Every line must pass or be
explicitly waived with a reason.

## Deterministic gates
- [ ] `npm run check` passes (build + résumé validation).
- [ ] `token-audit.mjs` exits 0: no raw colors outside `themes.css`, no
      Tier-1 leaks into components, no unevaluated calls in built HTML,
      all contrast pairs pass.

## Visual gates (from the screenshot matrix — actually look at the PNGs)
- [ ] Changed pages reviewed at 375px (mobile) and 1440px (desktop).
- [ ] Changed pages reviewed in light and dark, in the default theme; in ALL
      themes if the change touched color, surface, or type.
- [ ] No overlap, truncation, or wrap breakage at mobile width.
- [ ] No layout shift or reflow artifacts (e.g., fonts swapping mid-capture).
- [ ] Accent reads as signal, not decoration (links/active/emphasis only).
- [ ] Surfaces have consistent depth: bg < surface < surface-alt hierarchy
      holds in both modes.
- [ ] Prose respects `--measure`; headings have clear hierarchy.

## Consistency gates
- [ ] The change matches the taste direction in DESIGN.md (or DESIGN.md was
      not relied on because it is DRAFT, and that was said).
- [ ] Nothing in anti-patterns.md was introduced.
- [ ] Unchanged pages still look unchanged (spot-check one adjacent page).

## Site-specific gates
- [ ] `public/` legacy redirects untouched.
- [ ] Résumé page: if the résumé was touched, PDF/DOCX render paths still
      build (`npm run check` covers the data side; PDF render is a CI job).
- [ ] No new third-party assets, fonts, or scripts.

## Report format
When done, report: pages changed, themes/modes verified, audit output
summary, final screenshot directory, and anything waived with why.
