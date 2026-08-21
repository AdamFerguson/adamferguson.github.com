#!/usr/bin/env node
/**
 * token-audit.mjs — deterministic design-system gate for this repo.
 *
 * Checks:
 *   1. RAW-COLOR   raw hex/rgb/hsl colors in src/ (outside styles/themes.css;
 *                  styles/print.css is excluded and noted — print-only).
 *   2. TIER1-LEAK  var(--t-…) used outside src/styles/ (components must use
 *                  semantic tokens only).
 *   3. UNRESOLVED  unevaluated JS calls in built attributes (all HTML in dist/),
 *                  e.g. href="url(item.href)" from a backtick-wrapped call.
 *   4. CONTRAST    WCAG contrast ratios for every theme × mode combination,
 *                  computed from the token values in styles/themes.css.
 *
 * Usage (from the project root):
 *   node .pi/skills/website-design/scripts/token-audit.mjs
 *   node .pi/skills/website-design/scripts/token-audit.mjs --root <dir>
 *
 * Exit code: 1 on hard failures (raw colors found, Tier-1 leaks, or any
 * contrast pair below its threshold), 0 otherwise.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = (() => {
  const i = process.argv.indexOf("--root");
  return i >= 0 ? path.resolve(process.argv[i + 1]) : process.cwd();
})();

const findings = { rawColor: [], tier1Leak: [], unresolvedCall: [], contrast: [] };
let hardFailures = 0;

// --------------------------------------------------------------------------- walk
function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(css|astro|ts|mjs|js)$/.test(entry)) files.push(p);
  }
  return files;
}

const srcDir = path.join(root, "src");
const stylesDir = path.join(srcDir, "styles");

// --------------------------------------------------------------------------- 1+2: static scans
const COLOR_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\(\s*[\d.,\s%]+|hsla?\(\s*[\d.,\s%]+/g;
const TIER1_RE = /var\(\s*--t-[a-z0-9-]+/g;
// 3. Unevaluated JS call leaked into a built attribute, e.g. href="url(item.href)".
//    A backtick template literal around a function call in .astro evaluates to the
//    literal string, so the built HTML contains the raw call. Caught in dist/.
const UNRESOLVED_CALL_RE = /\b(href|src|action|poster)="[^"]*?\b[A-Za-z_$][\w$]*\s*\([^"]*\)/g;

for (const file of walk(srcDir)) {
  const rel = path.relative(root, file);
  const text = readFileSync(file, "utf8");
  if (rel.endsWith("styles/themes.css")) continue; // the only place raw colors belong
  if (rel.endsWith("styles/print.css")) continue; // print-only, reviewed manually

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(COLOR_RE)) {
      findings.rawColor.push({ file: rel, line: i + 1, value: m[0].trim() });
    }
    if (!rel.startsWith("src/styles/")) {
      for (const m of line.matchAll(TIER1_RE)) {
        findings.tier1Leak.push({ file: rel, line: i + 1, token: m[0] });
      }
    }
  });
}

// --------------------------------------------------------------------------- 3: built-HTML unresolved-call scan
const distDir = path.join(root, "dist");
if (existsSync(distDir)) {
  for (const file of walk(distDir).filter((f) => f.endsWith(".html"))) {
    const rel = path.relative(root, file);
    const text = readFileSync(file, "utf8");
    text.split("\n").forEach((line, i) => {
      for (const m of line.matchAll(UNRESOLVED_CALL_RE)) {
        findings.unresolvedCall.push({ file: rel, line: i + 1, value: m[0] });
      }
    });
  }
}
// --------------------------------------------------------------------------- 4: contrast
function parseHex(h) {
  let s = h.replace(/^#/, "");
  if (s.length === 3 || s.length === 4) s = s.split("").map((c) => c + c).join("");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function luminance([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

const themesCss = path.join(stylesDir, "themes.css");
const css = readFileSync(themesCss, "utf8");

function block(selectorRe) {
  const m = css.match(selectorRe);
  if (!m) throw new Error(`could not find selector block matching ${selectorRe} in themes.css`);
  const vars = {};
  for (const vm of m[1].matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) vars[vm[1]] = vm[2].trim();
  return vars;
}

const tokens = ["bg", "surface", "surface-alt", "text", "text-muted", "border", "accent", "on-accent"];
const base = {
  ferra: block(/:root,\s*\[data-theme="ferra"\]\s*\{([^}]*)\}/),
  slate: block(/\[data-theme="slate"\]\s*\{([^}]*)\}/),
  ink: block(/\[data-theme="ink"\]\s*\{([^}]*)\}/),
};
const dark = {
  ferra: block(/\[data-mode="dark"\](?:,\s*:root\[data-mode="dark"\])?\s*\{([^}]*)\}/),
  slate: block(/\[data-theme="slate"\]\[data-mode="dark"\](?:,\s*\[data-theme="slate"\]\[data-mode="dark"\])?\s*\{([^}]*)\}/),
  ink: block(/\[data-theme="ink"\]\[data-mode="dark"\](?:,\s*\[data-theme="ink"\]\[data-mode="dark"\])?\s*\{([^}]*)\}/),
};

function effective(theme, mode) {
  const v = { ...base[theme] };
  if (mode === "dark") {
    for (const t of tokens) {
      const key = `t-${t}`;
      if (dark.ferra[key] && !(theme !== "ferra" && dark[theme]?.[key])) v[key] = dark.ferra[key];
    }
    if (theme !== "ferra") {
      for (const t of tokens) {
        const key = `t-${t}`;
        if (dark[theme][key]) v[key] = dark[theme][key];
      }
    }
  }
  return v;
}

// Pairs: [foreground token, background token, min ratio, label]
const PAIRS = [
  ["t-text", "t-bg", 4.5, "text on bg"],
  ["t-text", "t-surface", 4.5, "text on surface"],
  ["t-text", "t-surface-alt", 4.5, "text on surface-alt"],
  ["t-text-muted", "t-bg", 4.5, "text-muted on bg"],
  ["t-text-muted", "t-surface", 4.5, "text-muted on surface"],
  ["t-on-accent", "t-accent", 4.5, "on-accent on accent"],
  ["t-accent", "t-bg", 3.0, "accent on bg (UI/large text)"],
  ["t-accent", "t-surface", 3.0, "accent on surface (UI/large text)"],
];

for (const theme of ["ferra", "slate", "ink"]) {
  for (const mode of ["light", "dark"]) {
    const v = effective(theme, mode);
    for (const [fg, bg, min, label] of PAIRS) {
      if (!v[fg] || !v[bg] || !/^#/.test(v[fg]) || !/^#/.test(v[bg])) continue;
      const r = ratio(parseHex(v[fg]), parseHex(v[bg]));
      const pass = r >= min;
      findings.contrast.push({ theme, mode, pair: label, ratio: Number(r.toFixed(2)), min, pass });
      if (!pass) hardFailures++;
    }
  }
}

// --------------------------------------------------------------------------- report
const c = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", dim: "\x1b[2m", reset: "\x1b[0m" };

console.log(`\n=== token-audit — ${path.relative(process.cwd(), root) || "."} ===\n`);

console.log(`1. Raw colors outside themes.css: ${findings.rawColor.length === 0 ? `${c.green}OK${c.reset}` : `${c.red}${findings.rawColor.length} found${c.reset}`}`);
for (const f of findings.rawColor.slice(0, 30)) console.log(`   ${c.red}✗${c.reset} ${f.file}:${f.line}  ${f.value}`);
if (findings.rawColor.length > 30) console.log(c.dim + `   … and ${findings.rawColor.length - 30} more` + c.reset);

console.log(`\n2. Tier-1 token leaks into components: ${findings.tier1Leak.length === 0 ? `${c.green}OK${c.reset}` : `${c.red}${findings.tier1Leak.length} found${c.reset}`}`);
for (const f of findings.tier1Leak.slice(0, 30)) console.log(`   ${c.red}✗${c.reset} ${f.file}:${f.line}  ${f.token}`);

console.log(`\n3. Unevaluated calls in built HTML (dist/): ${findings.unresolvedCall.length === 0 ? `${c.green}OK${c.reset}` : `${c.red}${findings.unresolvedCall.length} found${c.reset}`}`);
for (const f of findings.unresolvedCall.slice(0, 30)) console.log(`   ${c.red}✗${c.reset} ${f.file}:${f.line}  ${f.value}`);

console.log(`\n4. WCAG contrast (theme × mode):\n`);
for (const combo of [...new Set(findings.contrast.map((x) => `${x.theme}/${x.mode}`))]) {
  const [theme, mode] = combo.split("/");
  console.log(`  ${theme} · ${mode}`);
  for (const x of findings.contrast.filter((x) => x.theme === theme && x.mode === mode)) {
    const mark = x.pass ? c.green + "✓" : c.red + "✗";
    console.log(`   ${mark} ${x.pair.padEnd(30)} ${String(x.ratio).padStart(5)} : 1  (needs ${x.min})`);
  }
}

// Any raw color or leak is also a hard failure.
hardFailures += findings.rawColor.length + findings.tier1Leak.length + findings.unresolvedCall.length;

console.log(
  `\n${hardFailures === 0 ? c.green + "PASS" : c.red + `FAIL (${hardFailures} violation(s))` + c.reset}\n`,
);
process.exit(hardFailures === 0 ? 0 : 1);
