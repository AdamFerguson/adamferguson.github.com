# Résumé variants

Simplified versions of the résumé data (`../resume.yaml`), produced on the
`resume-simplify` branch. The active résumé is always `../resume.yaml`; these
files are the candidates to swap it with.

To use one, copy it over the active file and rebuild:

```bash
cp src/data/resume-variants/focused.yaml src/data/resume.yaml
npm run build && npm run preview
```

(Or just ask to switch — a one-line copy.)

## The three variants

| Variant | Length | Profile | Roles | Skills | Also keeps |
|---|---|---|---|---|---|
| **`focused.yaml`** *(recommended, active)* | ~2 pages | 2 sentences | 3 detailed + 4 one-line | 4 groups, tight | — |
| **`balanced.yaml`** | ~3 pages | 3 sentences | 4 detailed + 3 one-line | 5 groups | 1 award |
| **`concise.yaml`** | ~1 page | 1 line | 1 detailed + 3 one-line | 2 groups | — |

What all three drop vs. the original: the pre-2011 academic / analyst /
fellowship roles, the per-role tech-tag lists, and the (unrendered) interests
block. All three keep the education, contact info, and profile links.

- **Focused** — default for a senior/ML audience. Recent, high-impact roles in
  detail; earlier roles preserved as one-liners so the trajectory still reads.
- **Balanced** — a touch more complete: adds a 4th detailed role, a 5th skill
  group, and the award. Good if the reader wants more texture.
- **Concise** — one-page executive summary. Headline and current role; the
  rest is skimmable one-liners.
