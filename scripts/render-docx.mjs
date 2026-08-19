#!/usr/bin/env node
// Render a Word (.docx) résumé from the same YAML source (optional stretch
// goal). Approach: build a clean Markdown rendering of the résumé, then run
// pandoc with a reference doc for styles.
//
// Requires: pandoc (https://pandoc.org). Install with your package manager.
//   e.g.  sudo apt-get install pandoc   /   brew install pandoc
//
// Usage:  npm run docx
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const resumeFile = resolve(root, "src/data/resume.yaml");
const outDir = resolve(root, "public");
const OUT = resolve(outDir, "AdamFerguson-Resume.docx");

function fmt(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const data = parse(readFileSync(resumeFile, "utf8"));

// ---- Build a clean Markdown rendering -------------------------------
const L = [];
L.push(`# ${data.basics.name}`);
L.push(`**${data.basics.label}**`);
L.push("");
const contact = [
  data.basics.email,
  data.basics.location?.region || data.basics.location?.city,
  ...(data.basics.profiles ?? []).map((p) => `${p.network}: ${p.url}`),
].filter(Boolean);
L.push(contact.join(" · "));
L.push("");
L.push(data.basics.summary.trim());
L.push("");

if (data.skills?.length) {
  L.push("## Skills");
  for (const g of data.skills) L.push(`- **${g.name}**: ${g.keywords.join(", ")}`);
  L.push("");
}

if (data.work?.length) {
  L.push("## Experience");
  for (const job of data.work) {
    L.push(`### ${job.position} — ${job.company} (${fmt(job.startDate)} – ${job.endDate ? fmt(job.endDate) : "Present"})`);
    if (job.summary) L.push(job.summary);
    for (const h of job.highlights ?? []) L.push(`- ${h}`);
    L.push("");
  }
}

if (data.education?.length) {
  L.push("## Education");
  for (const ed of data.education) {
    L.push(`- **${ed.area}** — ${ed.institution} (${ed.studyType}) ${fmt(ed.startDate)}–${fmt(ed.endDate)}`);
  }
  L.push("");
}

if (data.awards?.length) {
  L.push("## Awards");
  for (const a of data.awards) L.push(`- ${a.title}${a.awarder ? ` — ${a.awarder}` : ""} (${fmt(a.date)})`);
  L.push("");
}

const md = L.join("\n");
const mdFile = resolve(outDir, ".resume-tmp.md");
writeFileSync(mdFile, md);

// ---- Run pandoc ------------------------------------------------------
try {
  execSync(
    `pandoc "${mdFile}" -f markdown -t docx -o "${OUT}"`,
    { stdio: "inherit" }
  );
  unlinkSync(mdFile);
  console.log(`✅ Wrote ${OUT}`);
} catch (err) {
  if (existsSync(mdFile)) unlinkSync(mdFile);
  console.error("pandoc failed (is it installed?).", err.message);
  process.exit(1);
}
