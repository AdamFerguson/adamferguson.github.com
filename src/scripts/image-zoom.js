// Click-to-zoom for figure images.
//
// medium-zoom (MIT, zero-dependency, ~3.7 kB) is bundled by Astro into the
// site's own assets — it is NOT loaded from a CDN, so the no-third-party-
// requests-at-runtime rule holds: zero external requests, no tracking.
import mediumZoom from "medium-zoom";

export function initImageZoom() {
  const zoom = mediumZoom("figure img", {
    // Theme-aware scrim: --overlay resolves to the active theme's Tier-1
    // token (see themes.css).
    background: "var(--overlay)",
  });

  // medium-zoom does no focus management: move focus into the zoomed image
  // when it opens (the clone only gets its class after the "open" event is
  // dispatched, so defer a frame), and back to the original figure image
  // when it closes.
  zoom.on("open", () => {
    requestAnimationFrame(() => {
      const zoomed = document.querySelector(".medium-zoom-image--opened");
      if (zoomed) {
        zoomed.setAttribute("tabindex", "-1");
        zoomed.focus({ preventScroll: true });
      }
    });
  });
  zoom.on("closed", (event) => {
    event.target.focus({ preventScroll: true });
  });

  // Keyboard access: figure images are not natively focusable or activatable
  // (Enter on an <img> does not fire click), and medium-zoom only listens
  // for clicks. Make them focusable and openable with Enter/Space.
  document.querySelectorAll("figure img").forEach((img) => {
    img.setAttribute("tabindex", "0");
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        zoom.open({ target: img });
      }
    });
  });
}
