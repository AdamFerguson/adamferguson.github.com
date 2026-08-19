#!/usr/bin/env node
// Render /resume/ to a PDF via Playwright (headless Chromium).
//
// Pipeline:
//   1. Build the site if no dist/ exists.
//   2. Start `astro preview` (serves dist/ on a local port).
//   3. Open /resume/ in headless Chromium and call page.pdf().
//   4. Write the PDF to public/AdamFerguson-Resume.pdf (the legacy path).
//   5. Always kill the preview server on exit.
//
// The PDF matches the on-screen /resume/ page because the print styles
// (src/styles/print.css) are baked into the build and Chromium applies the
// @media print rules when printing.
import { spawn, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const PORT = 4402;
// Use localhost (the preview server binds to localhost, not 127.0.0.1, in
// this environment).
const BASE = process.env.PDF_BASE || `http://localhost:${PORT}`;
const OUT = resolve(root, "public", "AdamFerguson-Resume.pdf");

let preview;
async function main() {
  const skipBuild = process.argv.includes("--skip-build");
  if (!existsSync(resolve(root, "dist")) && !skipBuild) {
    console.log("No dist/ found — running `npm run build` first...");
    execSync("npm run build", { cwd: root, stdio: "inherit" });
  }

  console.log(`Starting astro preview on ${BASE} ...`);
  preview = spawn("npx", ["astro", "preview", "--port", String(PORT)], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env },
  });
  preview.stderr.on("data", (d) => process.stderr.write(d));

  await waitForServer(BASE, 45000);

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${BASE}/resume/`, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: OUT,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: "0.6in", bottom: "0.6in", left: "0.7in", right: "0.7in" },
    });
    console.log(`✅ Wrote ${OUT}`);
  } finally {
    await browser.close().catch(() => {});
  }
  // Explicitly kill the preview server and exit so the process doesn't hang
  // (the spawn keeps the event loop alive otherwise).
  preview?.kill("SIGTERM");
  setTimeout(() => process.exit(0), 200).unref();
}

function waitForServer(base, timeout) {
  const start = Date.now();
  return new Promise((resolveP, rejectP) => {
    (function poll() {
      fetch(base + "/")
        .then((r) => resolveP())
        .catch(() => {
          if (Date.now() - start > timeout) {
            rejectP(new Error(`preview server did not start within ${timeout}ms`));
          } else {
            setTimeout(poll, 400);
          }
        });
    })();
  });
}

// Always clean up the preview server.
process.on("exit", () => preview?.kill("SIGTERM"));
process.on("SIGINT", () => {
  preview?.kill("SIGTERM");
  process.exit(0);
});

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    preview?.kill("SIGTERM");
  });
