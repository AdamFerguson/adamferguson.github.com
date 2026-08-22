// Click-to-zoom for figure images.
//
// medium-zoom (MIT, zero-dependency, ~3.7 kB) is bundled by Astro into the
// site's own assets — it is NOT loaded from a CDN, so the no-third-party-
// requests-at-runtime rule holds: zero external requests, no tracking.
import mediumZoom from "medium-zoom";

export function initImageZoom() {
  // Selector matches nothing until we attach: the zoom must only be enabled
  // once an image is actually decoded. medium-zoom computes its transform
  // from the image's natural dimensions, so a click while a lazy image is
  // still loading produces a mis-centered zoom (top of the image off-
  // screen). Images therefore join the zoom set on their load event.
  const zoom = mediumZoom("figure img[data-zoom-ready]", {
    // Theme-aware scrim: --overlay resolves to the active theme's Tier-1
    // token (see themes.css).
    background: "var(--overlay)",
    // Default margin is 0 (image fills the viewport edge-to-edge); leave a
    // small breathing margin all around.
    margin: 24,
  });

  document.querySelectorAll("figure img").forEach((img) => {
    const attach = () => zoom.attach(img);
    if (img.complete && img.naturalWidth > 0) {
      attach();
    } else {
      img.addEventListener("load", attach, { once: true });
    }
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
