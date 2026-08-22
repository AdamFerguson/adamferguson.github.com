// Adam Ferguson — site Worker.
//
// The site is a static Astro build in dist/ (wrangler.jsonc → assets).
// Assets-first mode: requests that match a deployed asset are served
// straight from the edge cache and never reach this handler — this code
// only runs for unmatched routes, where we forward back to the asset
// namespace so not_found_handling (dist/404.html) applies.
//
// This is also the seam for future dynamic routes (a real /email
// endpoint, generated content, ...): add them here, before the fallback.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
