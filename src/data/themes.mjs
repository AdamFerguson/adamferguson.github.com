// Single source of truth for the theme list used by dev tooling:
// the dev-only ThemeToggle component and the screenshot tooling
// (.pi/skills/website-design/scripts/screenshot.mjs --all-themes) both read
// from here.
//
// Adding a theme = two steps:
//   1. a Tier-1 token block in src/styles/themes.css (+ dark overrides)
//   2. its name appended to `themes` below
// See .pi/skills/website-design/references/token-architecture.md.
export const themes = ["ferra", "slate", "ink"];

// The default theme baked into <html data-theme> when no saved preference
// exists. The dev toggle lets the owner override this at runtime.
export const defaultTheme = "ferra";

// data-mode axis values (orthogonal to themes). "auto" resolves via
// prefers-color-scheme in the pre-paint script in Base.astro.
export const modes = ["auto", "light", "dark"];
export const defaultMode = "auto";
