/* ==========================================================================
   Viewport Universal UI — token resolution
   --------------------------------------------------------------------------
   Decides WHICH system's tokens a page renders with, and injects the
   stylesheet link for it.

   Load this SYNCHRONOUSLY in <head> (no defer), after systems/manifest.js and
   before the rest of the stylesheets. A <link> created by a synchronous inline
   script is still render-blocking, so there is no flash of unstyled content.

   Resolution order:
     1. ?system=<id> in the URL — lets any page be previewed under any system,
        which is how you compare a mockup across two versions side by side.
     2. The system the page lives inside, for a mockup under systems/<id>/.
     3. The default recorded in systems/manifest.js.
   ========================================================================== */

(() => {
  "use strict";

  const tag = document.currentScript || document.querySelector('script[src*="use-tokens.js"]');
  if (!tag) return;

  const root = new URL("../", tag.src);

  const known = Array.isArray(window.VP_SYSTEMS) ? window.VP_SYSTEMS : [];
  const isKnown = (id) => known.some((s) => s.id === id);

  const requested = new URLSearchParams(location.search).get("system");

  // systems/<id>/... anywhere in this page's own path.
  const inPath = /\/systems\/([^/]+)\//.exec(location.pathname)?.[1];

  const id =
    (requested && isKnown(requested) && requested) ||
    (inPath && isKnown(inPath) && inPath) ||
    inPath ||
    window.VP_SYSTEM_DEFAULT ||
    known[0]?.id;

  if (!id) {
    console.warn("[use-tokens] No system found. Run `node tools/reindex.mjs`.");
    return;
  }

  document.documentElement.dataset.system = id;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL(`systems/${id}/tokens.css`, root).href;
  document.head.append(link);

  // Pages that want to show which system they are rendering can read this.
  window.VP_ACTIVE_SYSTEM = id;
})();
