// Dev-only theme/mode switcher (theme exploration, per the approved plan).
//
// Loads from a <script> tag in the layout. It renders a floating control
// (bottom-right) with theme + mode buttons, persists the choice in
// localStorage, and applies it to <html>. In a PRODUCTION build this module
// is a no-op (the guard below), so the control never ships to visitors.
(function () {
  // Production builds: do nothing. (Astro sets import.meta.env.MODE.)
  if (import.meta.env?.MODE === "production") return;
  // Escape hatch: append ?no-theme-toggle to the URL to hide it.
  if (location.search.includes("no-theme-toggle")) return;

  const THEMES = ["ferra", "slate", "ink"];
  const MODES = ["auto", "light", "dark"];
  const root = document.documentElement;

  const state = {
    theme: localStorage.getItem("af-theme") || root.dataset.theme || "ferra",
    mode: localStorage.getItem("af-mode") || root.dataset.mode || "auto",
  };

  function apply() {
    root.dataset.theme = state.theme;
    root.dataset.mode = state.mode;
    localStorage.setItem("af-theme", state.theme);
    localStorage.setItem("af-mode", state.mode);
  }

  function build() {
    const wrap = document.createElement("div");
    wrap.className = "theme-toggle";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Theme preview (development only)");

    const addBtn = (group, value) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = value;
      b.dataset.group = group;
      b.dataset.value = value;
      b.className = value === state[group] ? "is-active" : "";
      b.addEventListener("click", () => {
        state[group] = value;
        apply();
        sync();
      });
      wrap.appendChild(b);
    };

    THEMES.forEach((t) => addBtn("theme", t));
    MODES.forEach((m) => addBtn("mode", m));

    const style = document.createElement("style");
    style.textContent = `
      .theme-toggle{position:fixed;right:12px;bottom:12px;z-index:200;
        display:flex;flex-wrap:wrap;gap:4px;max-width:240px;padding:6px;
        background:var(--surface);border:1px solid var(--border);
        border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.15);
        font:11px/1.2 var(--font-mono,monospace);color:var(--text)}
      .theme-toggle button{cursor:pointer;border:1px solid var(--border);
        background:transparent;color:inherit;padding:3px 8px;border-radius:6px}
      .theme-toggle button.is-active{background:var(--accent);
        color:var(--on-accent);border-color:transparent}
    `;
    document.head.appendChild(style);
    document.body.appendChild(wrap);
    sync();
  }

  function sync() {
    const wrap = document.querySelector(".theme-toggle");
    if (!wrap) return;
    wrap.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.value === state[b.dataset.group]);
    });
  }

  apply();
  build();
})();
