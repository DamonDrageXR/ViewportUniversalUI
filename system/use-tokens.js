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

  const el = document.documentElement;
  el.dataset.system = id;

  const sheet = (href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(href, root).href;
    document.head.append(link);
  };

  sheet(`systems/${id}/tokens.css`);

  const entry = known.find((s) => s.id === id);

  /* A system's structural rules — no shadows, buttons never filled, disabled is
     a hatch — are not values, so they cannot ride in tokens.css. They land as
     attributes on <html>, which the shared components style against and the
     audit reads back. Set BEFORE the component sheets load so nothing paints
     under the wrong rule first. */
  const rules = entry?.rules ?? {};
  for (const [key, value] of Object.entries(rules)) {
    if (value == null) continue;
    el.setAttribute(`data-rule-${key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`, String(value));
  }

  /* A single-theme system must not be left showing the theme it does not have:
     tokens.css only defines one, so an inherited data-theme from a host page
     would leave half the palette undefined. */
  const themes = entry?.themes ?? ["dark", "light"];
  if (themes.length === 1) el.dataset.theme = themes[0];

  // The system's own component layer, loaded after tokens so it can use them,
  // and after the shared components so it can override them.
  if (entry?.hasComponents) sheet(`systems/${id}/components.css`);

  // Pages that want to show which system they are rendering can read this.
  window.VP_ACTIVE_SYSTEM = id;
  window.VP_ACTIVE_RULES = rules;
})();
