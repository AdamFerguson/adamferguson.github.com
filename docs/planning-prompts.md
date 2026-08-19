# Planning & Delegation Prompts — site redesign

Verbatim prompts from the 2026-08-18 planning session (plan 23cb71ef), for
restarting the redesign in a fresh session.

## Prompt 1 — Plan-mode task (first message of the new session)

I want to redesign this personal website. It is currently a minimal resume site
built as a Jekyll static site and published from GitHub. Use read-only
investigation only. Do not edit files, install packages, create branches,
modify GitHub configuration, or run commands that alter the working tree.
First inspect the repository and report:
- The current Jekyll version, theme, plugins, layouts, includes, assets,
  configuration, and build/deploy workflow.
- How GitHub Pages is currently configured and whether deployment is
  source-based or GitHub Actions-based.
- The current content model for the resume and any existing posts/pages.
- Existing dependencies, design constraints, accessibility considerations,
  and migration risks.
Then create a redesign proposal with these goals:
- A visually distinctive but fast, accessible home page that introduces me as
  a software/infrastructure engineer.
- A dedicated resume section that remains easy to maintain from structured
  Markdown/data files.
- A blog section maintained in GitHub using Markdown posts, tags/categories,
  RSS, archives, and predictable URLs.
- A fully static site, automatically built and deployed through GitHub
  Actions to GitHub Pages if practical.
- Preserve existing URLs or specify exact redirects for any changed URLs.
- Keep the implementation low-maintenance and compatible with local preview
  on Linux.
Evaluate these architecture options before recommending one:
1. Stay on Jekyll with a custom theme/layouts and GitHub Actions.
2. Migrate to a modern static-site generator such as Astro while keeping
   Markdown/GitHub-based blog authoring.
3. Any third option only if it materially improves the above goals without
   adding substantial operational burden.
For each option, compare:
- Visual/design flexibility.
- Blog and resume authoring ergonomics.
- GitHub Pages deployment complexity.
- Performance and accessibility.
- Migration effort and long-term maintenance.
- Risks, including GitHub Pages plugin constraints.
Recommend one architecture and explain why.
Finally, write an implementation plan only. The plan must include:
- A proposed information architecture and route map.
- A proposed source/content model for resume, blog posts, images, metadata,
  navigation, tags, and RSS.
- The exact repository areas/files likely to be added, modified, or removed.
- Design-system direction: typography, color, responsive behavior, motion
  constraints, dark-mode approach, and accessibility requirements.
- A staged dependency-ordered task list.
- Clear acceptance criteria and validation commands for every stage.
- A migration/rollback strategy.
- A short list of decisions that require my approval before implementation.
Do not implement anything. End by asking for approval of the recommended
architecture and staged plan.

## Prompt 2 — Delegation instruction (after initial investigation starts)

Before synthesizing the plan, delegate three read-only research tasks in
parallel using the same configured local Qwen model:

1. Repository scout:
   Map the site's current structure, Jekyll configuration, layouts, includes,
   assets, posts, plugins, and current URL structure. Identify files likely
   affected by a redesign. Return concise evidence with file paths.

2. Deployment scout:
   Inspect GitHub Actions, Pages configuration files, Gemfile/lockfiles, and
   build commands. Identify the current deployment mechanism, constraints,
   and the minimal safe GitHub Actions deployment approach. Return concise
   evidence with file paths.

3. Content/design scout:
   Inspect the current resume content and identify a maintainable information
   architecture for a technical portfolio, resume, and Markdown blog. Propose
   semantic routes and note accessibility, performance, SEO, RSS, and
   redirect requirements. Do not suggest implementation yet.

Bring the reports back, resolve contradictions against repository evidence,
and then continue with the plan-only request.

## Prompt 3 — Resume repository fold-in

Something I'd like for you to incorporate in the plan: My resume actually
lives here. I would want this folded into the main application you're
building. Come up with a plan for porting it. I would also want help on
simplifying and modernizing the content in the resume, and keeping the resume
up to date: https://github.com/AdamFerguson/resume

## Prompt 4 — Architecture-brief framing (optional, forces planner discipline)

Stop the current line of investigation.
You are the architecture planner, not an implementer or migration-detail
analyst. Your job is to decide the major structural choices and produce an
implementer-ready architecture brief. Do not resolve micro-designs now.

Treat the following as deferred implementation details:
- Exact redirect rules or redirect-file syntax
- Exact GitHub Actions YAML
- Exact Jekyll plugin versions or configuration keys
- CSS values, component markup, animation implementation
- Individual post front matter, tag mechanics, or RSS template code
- Image pipeline commands
- Detailed test/check commands
- File-by-file edit instructions

For each deferred detail, record only:
1. The owner role: migration, deployment, design-system, content-model, or
   implementation worker.
2. The decision boundary or invariant it must satisfy.
3. Any risk that requires an explicit decision later.

Do not open new investigations or invoke additional subagents. Use only the
scout findings already received.

Return exactly one concise architecture brief with these sections and no
others:
1. Goals and non-goals — maximum 6 bullets total.
2. Recommended architecture — one clear recommendation, not a list of
   possibilities.
3. System boundaries — hosting/build, content, presentation, assets, and
   deployment.
4. Information architecture — route map only.
5. Content model — only the major content types and their ownership.
6. Design direction — visual principles and user experience, no
   implementation specifics.
7. Implementation workstreams — 4 to 6 independently assignable workstreams,
   each with: purpose, inputs, output/deliverable, dependencies, acceptance
   criteria.
8. Decision log — decisions made, assumptions, and open decisions.
9. Deferred-detail backlog — one line per deferred item, with owner and
   invariant.

Constraints:
- Maximum 1,500 words.
- Maximum 3 bullets in any subsection unless a route map or workstream list
  requires more.
- No code blocks.
- Do not mention a technical detail unless it changes architecture, an
  external interface, cost, security, maintainability, or an irreversible
  migration decision.
- When uncertain, state an assumption and continue. Do not investigate.
- End immediately after the deferred-detail backlog.

## Prompt 5 — Additional research items (one scout per item)

I approve the plan direction, but preserve it and add two research items for
scouts to go into more thoroughly, one scout per item:
1) I was never very happy with jsonresume but couldn't find anything better.
   It would be nice to know if there's something more astro native that would
   work. Basically, I want to be able to maintain my resume in a common
   format, like yaml or json, and then have a templating system applied to it
   that could produce a nice looking html AND pdf resume. Ideally would also
   produce a nice looking word resume. Does this exist? Would it be easy
   enough to build something like that from scratch?
2) The other item to investigate in more detail is I want to be able to
   experiment with different UI themes for the website resume. Can we do this
   easily via astro? I'd like to be presented with options and pick from
   amongst them.
Other than that love the plan and I think you should preserve it so we can
come up with a way of delegating out tasks for implementation.

## Operational notes for the fresh session

- The local model (adam-spark-qwen3-8-27b via litellm) is slow: parallel
  subagent research runs hit the 30-minute workflow timeout twice in the
  original session. Run one scout at a time, or two with a 45-60 minute
  timeout (subagent `timeoutMs`).
- If a run is interrupted, its partial output may be in
  `~/.pi/agent/sessions/<session-dir>/subagent-artifacts/<runId>_*_output.md`,
  and the full research context is in the matching `*_transcript.jsonl`.
- `resume` (workflow resume of a finished run) failed with "Agent 'gpt-pro'
  has invalid runner.type" in this environment — do not rely on it; instead
  recover from transcripts or relaunch.
- Plan mode blocks file writes and shell redirections; have the agent write
  notes only after the plan is approved.
- The resume source of truth is
  `ferguson.json` (jsonresume schema) in
  https://github.com/AdamFerguson/resume (custom domain
  adam-ferguson.com via CNAME in docs/); `resume.json` in that repo is only
  the jsonresume sample data.

## Key findings from the original session (summary)

- Main site: Jekyll-Bootstrap 0.1.0, active theme `tom`, source-based
  GitHub Pages build of the `master` branch; no GitHub Actions, no Gemfile;
  custom `_plugins/*.rb` do not run on Pages.
- Live URLs: `/`, `/about.html`, `/archive.html`, `/tags.html`,
  `/categories.html`, `/pages.html`, `/sitemap.txt`, `/atom.xml`,
  `/learning/2012/01/31/learning-markdown/`,
  `/lessons/2011/12/29/jekyll-introduction/`.
- Resume: jsonresume JSON rendered via resume-cli to HTML/PDF, deployed to
  adam-ferguson.com; last commit 2022-12-09; newest role Delta Bravo
  (2020-07-present).
- Research conclusions:
  - Resume data: keep jsonresume schema semantics, store as YAML, validate
    with ajv + @jsonresume/schema. PDF by printing the built `/resume/`
    page with Playwright in CI. Word (optional) via pandoc from a Markdown
    rendering.
  - Theming: three-tier design tokens (reference → semantic → component) as
    CSS custom properties, `data-theme` attribute switching (zero-JS),
    dark/light as an orthogonal axis; present 3-4 candidate themes via a dev
    toggle / preview URL.
- Approved decisions: Astro over Jekyll/Hugo; one repo/one pipeline;
  adam-ferguson.com becomes the primary domain; drop legacy posts (redirect
  old URLs); no analytics.
