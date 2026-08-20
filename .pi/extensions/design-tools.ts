/**
 * design-tools.ts — visual-verification tools for the website-design skill.
 *
 * Registers two tools that wrap .pi/skills/website-design/scripts/screenshot.mjs
 * so the designer can capture the site in one call instead of scripting bash:
 *
 *   screenshot     — quick/iterative capture (default theme, chosen pages)
 *   theme_matrix   — full theme × mode matrix (theme evaluation / regression)
 *
 * Both tools are fully headless: they build the site (unless skipBuild),
 * serve dist/ on a random localhost port, drive headless Chromium via
 * Playwright, and tear everything down. They return the output directory and
 * shot paths; the model must then read the PNGs to actually review the design.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
// This extension lives at <root>/.pi/extensions/ → root is two levels up.
const PROJECT_ROOT = path.resolve(THIS_DIR, "..", "..");
const SCRIPT = path.join(PROJECT_ROOT, ".pi", "skills", "website-design", "scripts", "screenshot.mjs");
const TIMEOUT_MS = 600_000;

interface CaptureResult {
  ok: boolean;
  outDir?: string;
  shots?: { file: string; page: string; theme: string; mode: string; width: number; status: number }[];
  output: string;
}

/** Run the screenshot script and extract the output directory + manifest. */
async function capture(pi: ExtensionAPI, args: string[], signal: AbortSignal | undefined): Promise<CaptureResult> {
  const res = await pi.exec("node", [SCRIPT, ...args], {
    cwd: PROJECT_ROOT,
    signal,
    timeout: TIMEOUT_MS,
  });
  const output = res.stdout + (res.stderr ? `\n${res.stderr}` : "");
  if (res.killed) {
    return { ok: false, output: `${output}\n(capture timed out after ${TIMEOUT_MS / 1000}s)` };
  }
  if (res.code !== 0) {
    return { ok: false, output };
  }
  // The script prints "… → <relative-dir>" on its last line; find the shots dir.
  const dirs = output.match(/design-shots\/[A-Za-z0-9-]+/g) ?? [];
  const outDir = dirs[dirs.length - 1];
  let shots: CaptureResult["shots"];
  if (outDir) {
    try {
      const manifest = JSON.parse(readFileSync(path.join(PROJECT_ROOT, outDir, "manifest.json"), "utf8"));
      shots = manifest.shots;
    } catch {
      shots = undefined;
    }
  }
  return { ok: true, outDir, shots, output };
}

function formatResult(r: CaptureResult, themeNote: string): string {
  if (!r.ok) {
    return `Capture FAILED.\n${r.output.slice(-3000)}\n\nDiagnose (e.g. run 'npx playwright install chromium', or check the build output) and retry, or run the script directly via bash.`;
  }
  const lines: string[] = [
    `Captured ${r.shots?.length ?? 0} screenshot(s) to ${r.outDir} ${themeNote}`,
    "",
    "Shots (page / theme / mode @ width):",
    ...(r.shots ?? []).map((s) => `  ${s.file}  (${s.page} / ${s.theme} / ${s.mode} @ ${s.width}px, HTTP ${s.status})`),
    "",
    `Manifest: ${r.outDir}/manifest.json`,
    "",
    "NEXT: read the PNG files (start with the home page in each theme/mode) and critique them against DESIGN.md and the review checklist. Do not report a design as verified without viewing the shots.",
  ];
  return lines.join("\n");
}

export default function designTools(pi: ExtensionAPI) {
  pi.registerTool({
    name: "screenshot",
    label: "Design Screenshot",
    description:
      "Capture headless screenshots of the built site (builds + serves dist/, drives headless Chromium, tears down). " +
      "Default: quick set — default theme, light+dark, 1440px, key pages. Returns PNG paths to read. " +
      "Use for design verification after changing pages/components; after any CSS change prefer theme_matrix.",
    promptSnippet: "Capture headless screenshots of the site for design review",
    promptGuidelines: [
      "Use screenshot after design work to capture current state; read the returned PNGs to visually verify before claiming done.",
    ],
    executionMode: "sequential",
    parameters: Type.Object({
      quick: Type.Optional(Type.Boolean({ description: "Quick iteration set: default theme, light+dark, 1440px, key pages. Default: true." })),
      pages: Type.Optional(Type.Array(Type.String(), { description: "Page paths, e.g. [\"/\", \"/about/\", \"/blog/\"]. \"404\" captures the 404 page." })),
      themes: Type.Optional(Type.Array(Type.String(), { description: "Themes to capture, e.g. [\"ferra\"]. Default: [\"ferra\"]." })),
      modes: Type.Optional(Type.Array(Type.String(), { description: "Modes to capture. Default: [\"light\", \"dark\"]." })),
      viewports: Type.Optional(Type.Array(Type.Number(), { description: "Viewport widths. Default: [1440] for quick, [375, 1440] otherwise." })),
      skipBuild: Type.Optional(Type.Boolean({ description: "Reuse the existing dist/ instead of rebuilding. Default: false." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
      if (signal?.aborted) return { content: [{ type: "text", text: "Cancelled" }] };
      const args: string[] = [];
      if (params.quick !== false) args.push("--quick");
      else if (!params.viewports?.length) args.push("--viewports", "375,1440");
      if (params.pages?.length) args.push("--pages", params.pages.join(","));
      if (params.themes?.length) args.push("--themes", params.themes.join(","));
      if (params.modes?.length) args.push("--modes", params.modes.join(","));
      if (params.viewports?.length && params.quick !== false) args.push("--viewports", params.viewports.join(","));
      if (params.skipBuild) args.push("--skip-build");
      const r = await capture(pi, args, signal);
      return { content: [{ type: "text", text: formatResult(r, "(quick/iterative set)") }], details: { outDir: r.outDir } };
    },
  });

  pi.registerTool({
    name: "theme_matrix",
    label: "Theme Matrix",
    description:
      "Capture the FULL theme matrix (every theme in themes.css × light+dark × viewports) of the built site, headlessly. " +
      "Use for theme evaluation, theme changes, and any CSS change that touches color/surface/type. Returns PNG paths to read.",
    promptSnippet: "Capture the full theme × mode screenshot matrix for design review",
    promptGuidelines: [
      "Use theme_matrix whenever a change touches themes, colors, surfaces, or typography, or when evaluating a theme pick; read the returned home-page PNGs in each theme/mode before deciding.",
    ],
    executionMode: "sequential",
    parameters: Type.Object({
      pages: Type.Optional(Type.Array(Type.String(), { description: "Page paths to capture. Default: [\"/\", \"/about/\", \"/blog/\", \"/resume/\"]." })),
      viewports: Type.Optional(Type.Array(Type.Number(), { description: "Viewport widths. Default: [375, 1440]." })),
      skipBuild: Type.Optional(Type.Boolean({ description: "Reuse the existing dist/ instead of rebuilding. Default: false." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
      if (signal?.aborted) return { content: [{ type: "text", text: "Cancelled" }] };
      const args = ["--all-themes"];
      if (params.pages?.length) args.push("--pages", params.pages.join(","));
      if (params.viewports?.length) args.push("--viewports", params.viewports.join(","));
      if (params.skipBuild) args.push("--skip-build");
      const r = await capture(pi, args, signal);
      return { content: [{ type: "text", text: formatResult(r, "(full theme matrix)") }], details: { outDir: r.outDir } };
    },
  });
}
