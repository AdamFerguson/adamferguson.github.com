#!/usr/bin/env node
/**
 * screenshot.mjs — capture the built site across a theme/mode/viewport matrix.
 *
 * Fully headless and autonomous: builds the site, serves dist/ with a
 * built-in static server on a random localhost port, drives headless
 * Chromium (Playwright), writes PNGs + manifest.json, and tears everything
 * down. No human in the loop. (We do not use `astro preview` because its
 * PID-file state can conflict with a server the owner has running.)
 *
 * Usage (from the project root):
 *   node .pi/skills/website-design/scripts/screenshot.mjs [options]
 *
 * Options:
 *   --quick              fast iteration set: default theme, light+dark,
 *                        1440px, key pages (/, /about/, /blog/, /resume/)
 *   --all-themes         capture every theme in themes.css (ferra, slate, ink)
 *   --pages /,/about/    comma list of page paths to capture; use the literal
 *                        value `404` to capture the 404 page (random URL)
 *   --themes ferra,ink   comma list of themes
 *   --modes light,dark   comma list of modes (default: light,dark)
 *   --viewports 375,1440 comma list of widths (height is 900; 375 uses 812)
 *   --skip-build         reuse the existing dist/ instead of rebuilding
 *   --viewport-only      capture the viewport instead of the full page
 *   --out <dir>          output directory (default: <root>/design-shots/<ts>)
 *   --root <dir>         project root (default: cwd)
 *
 * First use may require: npx playwright install chromium
 */

import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir, readFile } from "node:fs/promises";

// --------------------------------------------------------------------------- args
function parseArgs(argv) {
  const opts = {
    quick: false,
    allThemes: false,
    pages: null,
    themes: null,
    modes: ["light", "dark"],
    viewports: null,
    skipBuild: false,
    fullPage: true,
    out: null,
    root: process.cwd(),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--quick": opts.quick = true; break;
      case "--all-themes": opts.allThemes = true; break;
      case "--skip-build": opts.skipBuild = true; break;
      case "--viewport-only": opts.fullPage = false; break;
      case "--pages": opts.pages = argv[++i].split(",").map((s) => s.trim()); break;
      case "--themes": opts.themes = argv[++i].split(",").map((s) => s.trim()); break;
      case "--modes": opts.modes = argv[++i].split(",").map((s) => s.trim()); break;
      case "--viewports": opts.viewports = argv[++i].split(",").map((s) => parseInt(s.trim(), 10)); break;
      case "--out": opts.out = argv[++i]; break;
      case "--root": opts.root = path.resolve(argv[++i]); break;
      case "--help":
      case "-h":
        console.log("See the header comment of this script for usage.");
        process.exit(0);
    }
  }
  if (opts.allThemes) {
    opts.themes = ["ferra", "slate", "ink"];
  }
  if (opts.quick) {
    opts.themes ??= ["ferra"];
    opts.pages ??= ["/", "/about/", "/blog/", "/resume/"];
    opts.viewports ??= [1440];
  }
  opts.themes ??= ["ferra"];
  opts.viewports ??= [375, 1440];
  if (!opts.pages) {
    opts.pages = [
      "/",
      "/about/",
      "/blog/",
      "/blog/moving-to-astro/",
      "/tags/",
      "/tags/astro/",
      "/categories/Engineering/",
      "/resume/",
    ];
  }
  return opts;
}

// --------------------------------------------------------------------------- helpers
function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: "inherit" });
    p.on("error", reject);
    p.on("exit", (code, signal) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code ?? signal}`)),
    );
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".xml": "application/xml",
  ".json": "application/json",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

/** Minimal static server for dist/ with MPA semantics (dir/index.html, .html
 *  fallback, 404.html with a real 404 status). */
async function startStaticServer(distDir, port) {
  const server = http.createServer(async (req, res) => {
    try {
      const p = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const candidates = p.endsWith("/")
        ? [p + "index.html"]
        : [p, p + ".html", p + "/index.html"];
      for (const c of candidates) {
        const file = path.join(distDir, c);
        if (!file.startsWith(distDir + path.sep) && file !== distDir) continue;
        try {
          const data = await readFile(file);
          res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
          res.end(data);
          return;
        } catch {}
      }
      const nf = path.join(distDir, "404.html");
      try {
        const data = await readFile(nf);
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return server;
}

async function waitForServer(base, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(base);
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview server at ${base} did not become ready within ${timeoutMs}ms`);
}

function slug(page) {
  if (page === "/") return "home";
  if (page === "404") return "not-found";
  return page.replace(/\/+/g, "-").replace(/^-/, "").replace(/-$/, "") || "root";
}

function heightFor(w) {
  return w <= 500 ? 812 : 900;
}

// --------------------------------------------------------------------------- main
const opts = parseArgs(process.argv.slice(2));
const root = opts.root;
const base = "http://127.0.0.1";

if (!opts.skipBuild) {
  console.log(`[screenshot] building site (cd ${root} && astro build)…`);
  await run("npx", ["astro", "build"], root);
}

const outDir = path.resolve(root, opts.out ?? path.join("design-shots", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)));
await mkdir(outDir, { recursive: true });

// Theme discovery: read the canonical list from src/data/themes.mjs so
// --all-themes stays correct when new themes are added (falls back to the
// known set if the file is missing/unreadable).
async function loadThemes() {
  try {
    const mod = await import(pathToFileURL(path.join(root, "src", "data", "themes.mjs")).href);
    if (Array.isArray(mod.themes) && mod.themes.length > 0) return mod.themes;
  } catch {}
  return ["ferra", "slate", "ink"];
}
if (opts.allThemes) opts.themes = await loadThemes();

const port = await freePort();
const distDir = path.join(root, "dist");
let server;
try {
  server = await startStaticServer(distDir, port);
} catch (err) {
  console.error(`[screenshot] could not serve dist/ on port ${port}: ${err.message}`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  server.close();
  console.error("[screenshot] could not import playwright. Run from the project root (it is a devDependency), or: npm install");
  process.exit(1);
}

let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  server.close();
  console.error("[screenshot] failed to launch Chromium — run once: npx playwright install chromium");
  console.error(String(err?.message ?? err));
  process.exit(1);
}

const manifest = [];
let failures = 0;

try {
  await waitForServer(`${base}:${port}`);
  console.log(`[screenshot] static server ready at ${base}:${port}; capturing ${opts.pages.length} pages × ${opts.themes.length} themes × ${opts.modes.length} modes × ${opts.viewports.length} viewports`);

  for (const pagePath of opts.pages) {
    for (const theme of opts.themes) {
      for (const mode of opts.modes) {
        for (const width of opts.viewports) {
          const height = heightFor(width);
          const file = path.join(outDir, `${slug(pagePath)}__${theme}-${mode}@${width}.png`);
          const ctx = await browser.newContext({
            viewport: { width, height },
            colorScheme: mode,
          });
          const page = await ctx.newPage();
          const is404Test = pagePath === "404"; // sentinel: capture the 404 page
          const reqPath = is404Test ? `/__screenshot-404-probe__` : pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
          const url = `${base}:${port}${reqPath}`;
          try {
            const res = await page.goto(url, { waitUntil: "load", timeout: 30000 });
            const status = res?.status() ?? 0;
            if (is404Test && status !== 404) console.warn(`[screenshot] WARN expected 404 for ${url}, got ${status}`);
            if (!is404Test && status >= 400) console.warn(`[screenshot] WARN ${status} for ${url}`);

            // Force the exact theme/mode (built pages default to ferra/auto).
            await page.evaluate(
              ({ theme, mode }) => {
                const r = document.documentElement;
                r.setAttribute("data-theme", theme);
                r.setAttribute("data-mode", mode);
              },
              { theme, mode },
            );
            await page.evaluate(() => document.fonts.ready);
            await new Promise((r) => setTimeout(r, 200)); // settle
            await page.screenshot({ path: file, fullPage: opts.fullPage });
            manifest.push({ file: path.relative(root, file), page: pagePath, theme, mode, width, height, status });
            console.log(`[screenshot] ✓ ${path.relative(root, file)} (status ${status})`);
          } catch (err) {
            failures++;
            console.error(`[screenshot] ✗ ${url}: ${err.message}`);
          } finally {
            await ctx.close();
          }
        }
      }
    }
  }

  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify({ capturedAt: new Date().toISOString(), outDir: path.relative(root, outDir), shots: manifest }, null, 2),
  );
  console.log(`[screenshot] done: ${manifest.length} shots, ${failures} failures → ${path.relative(root, outDir)}`);
} finally {
  await browser.close().catch(() => {});
  await new Promise((resolve) => server.close(resolve));
}

if (failures > 0) process.exit(1);
