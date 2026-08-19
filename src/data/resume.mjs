// Load the single-source-of-truth resume (JSON Resume schema, YAML-stored).
//
// The YAML is imported at BUILD TIME via a Vite import assertion, so its
// value is inlined into the compiled bundle. This is important: a runtime
// readFileSync would fail during the static "generate" phase, when the
// compiled chunks run from dist/ and the source file is no longer on a
// predictable path.
import resumeData from "../data/resume.yaml" with { type: "yaml" };

// Parse the imported value. Vite's YAML plugin returns the parsed object
// directly; guard for a string just in case.
import { parse } from "yaml";

export function loadResume() {
  return typeof resumeData === "string" ? parse(resumeData) : resumeData;
}

// Convenience helpers used across pages.
export function resumeBasics(resume = loadResume()) {
  return resume.basics;
}

export function currentRole(resume = loadResume()) {
  const work = resume.work ?? [];
  // The most recent role is the first entry (newest first).
  return work[0];
}
