#!/usr/bin/env node
// Validate src/data/resume.yaml against the JSON Resume schema.
// Run in CI (`npm run validate:resume`) and locally. Fails the build if the
// resume data is invalid, so a typo never silently ships.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parse } from "yaml";
import { validate } from "@jsonresume/schema";

const here = dirname(fileURLToPath(import.meta.url));
const resumeFile = resolve(here, "..", "src", "data", "resume.yaml");
const data = parse(readFileSync(resumeFile, "utf8"));

// @jsonresume/schema.validate accepts the data object and a callback.
validate(data, (errors, valid) => {
  if (valid) {
    console.log(`✅ resume.yaml is valid JSON Resume data (${data.work?.length ?? 0} roles).`);
  } else {
    console.error("❌ resume.yaml failed JSON Resume schema validation:");
    for (const err of errors ?? []) {
      console.error(`  - ${err.dataPath || err.instancePath || "/"} ${err.message}`);
    }
    process.exit(1);
  }
});
