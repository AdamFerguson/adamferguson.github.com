// Dev-only floating theme/mode switcher, injected entirely at runtime.
//
// This module builds its own <style> element (as a JS string) and its own
// DOM, so nothing here passes through Astro's CSS pipeline — meaning it
// leaves ZERO trace in a production CSS bundle. Base.astro imports it only
// behind an import.meta.env.DEV guard, so in production builds the import
// itself is tree-shaken away and this file never ships.
//
// Future-proof: the theme + mode lists are imported from src/data/themes.mjs
// (the single source of truth), and buttons are generated from whatever is in
// that list. Adding a new theme to themes.mjs + themes.css makes it appear
// here automatically — no changes to this file.
//
// Choices persist in localStorage under af-theme / af-mode, the same keys the
// pre-paint inline script in Base.astro reads, so the selection survives
// reloads.
import { themes, modes } from "../data/themes.mjs";

const CSS = `
.af-theme-toggle{position:fixed;right:12px;bottom:12px;z-index:200;
  display:flex;flex-wrap:wrap;gap:4px;align-items:center;max-width:260px;
  padding:6px;background:var(--surface);border:1px solid var(--border);
  border-radius:10px;box-shadow:0 4px 16px color-mix(in srgb, var(--text) 18%, transparent);
  font-family:var(--font-mono);font-size:11px;line-height:1.2;color:var(--text)}
.af-theme-toggle__label{width:100%;opacity:.6;letter-spacing:.06em;
  text-transform:uppercase;font-size:9px}
.af-theme-toggle button{cursor:pointer;border:1px solid var(--border);
  background:transparent;color:inherit;padding:3px 8px;border-radius:6px;font:inherit}
.af-theme-toggle button.is-active{background:var(--accent);color:var(--on-accent);
  border-color:transparent}
`;

export function initThemeToggle() {
  const root = document.documentElement;
  if (document.querySelector(".af-theme-toggle")) return; // idempotent

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "af-theme-toggle";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Theme preview (development only)");

  const label = document.createElement("span");
  label.className = "af-theme-toggle__label";
  label.textContent = "dev theme";
  wrap.appendChild(label);

  const addBtn = (group, value) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = value;
    b.dataset.group = group;
    b.dataset.value = value;
    wrap.appendChild(b);
  };
  themes.forEach((t) => addBtn("theme", t));
  modes.forEach((m) => addBtn("mode", m));
  document.body.appendChild(wrap);

  const state = {
    theme: localStorage.getItem("af-theme") || root.dataset.theme || "ferra",
    mode: localStorage.getItem("af-mode") || root.dataset.mode || "auto",
  };

  const sync = () => {
    wrap.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.value === state[b.dataset.group]);
    });
  };

  const apply = () => {
    root.dataset.theme = state.theme;
    root.dataset.mode = state.mode;
    localStorage.setItem("af-theme", state.theme);
    localStorage.setItem("af-mode", state.mode);
    sync();
  };

  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-group]");
    if (!b) return;
    state[b.dataset.group] = b.dataset.value;
    apply();
  });

  apply();
}
