#!/usr/bin/env node
// Set which résumé variant is the active src/data/resume.yaml.
//
// Usage:
//   node scripts/use-resume.mjs <focused|balanced|concise>
//   npm run resume:set -- balanced
//
// Then run `npm run dev` (dev server, hot reload) or
// `npm run build && npm run preview` and open http://localhost:4321/resume/.
import { cpSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const variants = ["focused", "balanced", "concise"];
const variant = process.argv[2];

if (!variant || !variants.includes(variant)) {
  console.log("Set the active résumé variant:");
  console.log(`  ${variants.map((v) => `npm run resume:set -- ${v}`).join("\n  ")}`);
  process.exit(variant ? 1 : 0);
}

const src = resolve(root, "src/data/resume-variants", `${variant}.yaml`);
const dest = resolve(root, "src/data/resume.yaml");
cpSync(src, dest);
console.log(`✅ Active résumé → ${variant}`);
console.log("   Run `npm run dev` and open http://localhost:4321/resume/");
