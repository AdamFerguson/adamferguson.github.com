// Light/dark mode toggle in the site header.
//
// The heavy lifting already exists: the pre-paint inline script in
// Base.astro resolves the mode (localStorage "af-mode" or
// prefers-color-scheme) into an explicit light/dark data-mode attribute
// before first paint, and themes.css layers the dark palettes on
// [data-mode="dark"]. This module just flips that attribute and persists
// the choice — the same key the pre-paint script reads.
const root = document.documentElement;

export function initModeToggle() {
  const btn = document.querySelector(".mode-toggle");
  if (!btn) return;

  const sun = btn.querySelector(".mode-toggle__sun");
  const moon = btn.querySelector(".mode-toggle__moon");

  const sync = () => {
    // Show the icon of the mode the user would switch TO.
    // NB: the icons are <svg> elements, where .hidden is NOT a reflected
    // property (that's HTMLElement-only) — use the attribute directly.
    const goingToLight = root.dataset.mode === "dark";
    sun.toggleAttribute("hidden", !goingToLight);
    moon.toggleAttribute("hidden", goingToLight);
    btn.setAttribute(
      "aria-label",
      goingToLight ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  btn.addEventListener("click", () => {
    const next = root.dataset.mode === "dark" ? "light" : "dark";
    root.dataset.mode = next;
    try {
      localStorage.setItem("af-mode", next);
    } catch {
      /* private mode etc. — the flip still applies for this session */
    }
    sync();
  });

  sync();
}
