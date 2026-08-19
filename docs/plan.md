# Redesign adamsferguson.github.com — Astro + structured resume + Markdown blog

Final approved plan (plan 23cb71ef, approved 2026-08-18).

Approved direction: Astro on a single repo, one GitHub Actions pipeline,
adam-ferguson.com as primary domain, legacy posts dropped with redirects, no
analytics. This plan finalizes the two open research items and sets up
delegation.

## 1. Research conclusions (from the two follow-up scouts)

### Resume data + HTML/PDF/Word
- **No single off-the-shelf tool** does data → nice HTML + PDF + Word for a
  static site. But every piece exists and is cheap to assemble:
  - **Data format:** keep the jsonresume schema (mature, open, revived in
    2026 as `@jsonresume/schema` + `resume-cli` on npm) but **store it as
    YAML** (YAML is a superset of JSON; comments + no escaping make it far
    easier to edit in git). Validate with `ajv` against the jsonresume JSON
    Schema in CI.
  - **HTML:** an Astro page that templates the YAML — the primary `/resume/`
    view.
  - **PDF:** print the *actual built* `/resume/` page with **Playwright
    headless Chromium in CI** (`page.pdf()` with print CSS) →
    `public/AdamFerguson-Resume.pdf`. WYSIWYG parity with the web page;
    standard practice (multiple real-world examples: scottadams.ca,
    brunogbv/cv, AkioKoneko/resume). wkhtmltopdf is archived (avoid);
    WeasyPrint lacks modern CSS (avoid).
  - **Word (optional, stretch):** `pandoc` from a Markdown rendering of the
    same data, with a `--reference-doc` for styles. Ranked second; HTML+PDF
    are canonical. (html-docx-js / html-to-docx / dom-docx are browser-side
    or lower-fidelity alternatives.)
  - **Effort:** ~1–2 h for HTML+PDF pipeline; ~2–3 h for Word. Realistic and
    low-maintenance.
- Alternatives considered: RenderCV (YAML→PDF, 17k★, local CLI),
  YAMLResume (YAML→PDF/DOCX/HTML via LaTeX, needs XeTeX/Tectonic, 0.x),
  HackMyResume (JSON→HTML/MD/LaTeX/Word/PDF, but stale repo), Reactive
  Resume (GUI-first, not git-first), GitResume (hosted, paid tiers). None
  beat "Astro page + Playwright PDF" on the user's constraints (own the
  pipeline, git, no hosted dependency).

### Astro theming
- **Architecture:** three-tier design tokens (reference → semantic →
  component) as CSS custom properties. A "theme" = one token set (+ a few
  component variants). Switch themes by flipping a `data-theme` attribute on
  `<html>` — zero-JS, no re-render, no flash.
- **Dark/light** is an orthogonal axis (separate `data-mode` or `.dark`
  class), not a "theme", avoiding combinatorial explosion.
- **Presenting options:** ship 3–4 candidate themes as token sets + a
  dev-only theme switcher (small inline script + localStorage) and/or a
  preview URL, so the owner can view each on real content and pick.
- Real-world pattern: astro-rocket ships 12 live-switchable color themes on
  a 3-tier token system; Salty CSS documents the `data-theme` attribute
  mechanism; Astro blog docs document the `localStorage` +
  `prefers-color-scheme` toggle.
- **Effort:** ~1–2 days for token architecture + 3 candidate themes +
  preview mechanism.

## 2. Information architecture (route map)
- `/` — home: intro, resume CTA, recent posts
- `/resume/` — resume from YAML, print-friendly;
  `/AdamFerguson-Resume.pdf` — generated PDF (legacy path preserved)
- `/about/` — bio/background
- `/blog/` — index + archive · `/blog/{slug}/` — posts
- `/tags/`, `/tags/{tag}/`, `/categories/`, `/categories/{category}/`
- `/feed.xml` — RSS (old `/atom.xml` redirects) · `/sitemap.xml` (old
  `/sitemap.txt` redirects)
- `/404` — branded not-found

## 3. Content model (major types + ownership)
- **Resume:** one YAML file (jsonresume schema), user-owned via PR; drives
  `/resume/`, home summary, Person JSON-LD, PDF, and (optional) Word.
  Validated in CI.
- **Blog:** one Markdown file per post, front matter
  (title/date/description/tags/category), filename = slug. Legacy posts
  dropped (redirects only).
- **Pages/assets:** home/about are presentation pages with inline prose;
  about evolves from `about.md` + the "an introduction" draft; images in
  `public/` with alt text + dimensions.

## 4. Design direction
- Persona: "the engineer's desk" — confident, technical, human.
- Typography-led: strong heading hierarchy, one display face + system UI
  body + mono accents; light-first palette with one accent; automatic dark
  mode + optional toggle.
- Performance/a11y floor: zero JS on content pages, one bounded global
  stylesheet, no hotlinked assets; WCAG AA contrast, semantic landmarks,
  visible focus, reduced-motion respected.
- Theming: token architecture + `data-theme` switching per §1.

## 5. Workstreams (delegation-ready, dependency-ordered)
Each is independently assignable; the full brief + scout reports are
preserved in `docs/planning-prompts.md` for handoff.
1. **Content modernization** — resume YAML (2020–present roles, curated
   skills, rewritten summary), about prose, (no legacy posts). Deps: user
   input. Acceptance: user sign-off; YAML validates against jsonresume
   schema.
2. **Site scaffold + content model** — Astro project on a `redesign` branch,
   layouts, blog collection, data plumbing, all routes render. Deps:
   architecture decision. Acceptance: clean build + local preview, every
   route present.
3. **Design system + presentation** — global stylesheet, 3 candidate
   themes, theme preview mechanism, all page views, print styles for
   `/resume/`. Deps: WS2. Acceptance: owner picks a theme; a11y floor met;
   local/production parity.
4. **Resume pipeline** — YAML→HTML page, CI Playwright PDF to legacy path,
   optional pandoc Word, CI schema validation. Deps: WS1, WS2. Acceptance:
   PDF matches web page; broken YAML fails CI.
5. **Deployment + domain cutover + URL preservation** — Actions workflow
   (preview env on branch, production on default), Pages switched to
   artifact deploy, adam-ferguson.com attached, legacy Jekyll scaffold
   removed from default branch, redirects covering all legacy URLs. Deps:
   WS2–4. Acceptance: green deploy; both domains serve new site over HTTPS;
   every legacy URL lands on its target.
6. **Maintenance tooling + docs** — README authoring guide (new post,
   resume update, PDF refresh), CI resume validation. Deps: WS1, WS2.
   Acceptance: invalid YAML fails CI; documented local loop works on Linux.

## 6. Files add/modify/remove
- **Remove (legacy Jekyll-Bootstrap):** `_includes/**`, `_layouts/**`,
  `_plugins/**`, `_cache/**`, `assets/**` (except the marshall-park image),
  `Rakefile`, `archive.html`, `categories.html`, `tags.html`, `pages.html`,
  `sitemap.txt`, `atom.xml`, `about.md`, `index.md`, `README.md`,
  `_config.yml`, both `_posts/`, `_drafts/`.
- **Add:** `astro.config.mjs`, `package.json`/lock, `tsconfig.json`,
  `public/**` (favicon, robots.txt, resume.pdf, images), `src/**` (pages,
  layouts, styles, `data/resume.yaml`, `content/blog/`),
  `.github/workflows/astro.yml`, `redirects.txt`, new `README.md`,
  `docs/planning-prompts.md` (already written).
- **Keep/move:** the marshall-park image → `public/images/` (resized, alt
  text).

## 7. Migration/rollback
- Old site stays intact on `master` until cutover; develop on `redesign`.
  Pre-cutover rollback = drop the branch. Post-cutover rollback =
  `git revert` the merge + point Pages back to branch-based source. Domain
  cutover is reversible (re-point the CNAME). All content is
  version-controlled; the resume repo is only archived after final
  sign-off.

## 8. Validation (per stage)
- `npm run build` (clean), `npm run dev`/`preview` (routes render),
  `npx ajv` schema check on resume YAML, feed/sitemap XML well-formedness
  check, Lighthouse a11y ≥ 95, `curl -sI` on each legacy URL after cutover
  (expect 301 → target), Playwright PDF produced in CI.

## 9. Decisions requiring your approval
1. **Architecture** — Astro (recommended) vs Jekyll vs Hugo.
2. **Resume data format** — keep jsonresume schema stored as YAML
   (recommended) vs plain custom YAML/JSON.
3. **Word output** — include pandoc DOCX now, or defer as a stretch goal.
4. **Domain** — point adam-ferguson.com at the new unified site
   (recommended), keep adamferguson.github.com as alias.
5. **Legacy posts** — drop both with redirects (confirmed OK) vs keep one
   or both.
6. **Analytics** — none for now (confirmed OK).
7. **Theme selection** — 3–4 candidates will be presented after WS3; final
   pick then.
8. **Dark mode** — system-only vs manual toggle.

## 10. Status / next steps
- `docs/planning-prompts.md` — preserved prompts + research notes (done).
- `docs/plan.md` — this approved plan (done).
- Next: workstream 1 (content modernization), pending user input on
  2020–present roles, curated skills, and summary rewrite.
