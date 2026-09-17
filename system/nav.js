/* ==========================================================================
   Viewport Universal UI — Review navigation
   --------------------------------------------------------------------------
   Injects a sticky bar giving every page a way back to the gallery and a
   prev/next pager through the whole repo, so you can flick through everything
   without bouncing off the browser back button.

   Install on any page with two lines:

     <link rel="stylesheet" href="../../system/nav.css">
     <script src="../../system/nav.js" defer></script>

   The repo root is derived from this script's own src, so the same two lines
   work at any folder depth. No dependencies, works from file://.
   ========================================================================== */

(() => {
  "use strict";

  // `defer` still sets currentScript, but fall back to a lookup in case this
  // is ever loaded some other way.
  const tag =
    document.currentScript || document.querySelector('script[src*="nav.js"]');
  if (!tag) return;

  // ?chrome=0 suppresses review chrome. The studio's live preview embeds real
  // pages, and a nav bar inside a 300px preview is noise, not navigation.
  if (new URLSearchParams(location.search).get("chrome") === "0") return;


  // nav.js lives in system/, so one level up is the repo root.
  const root = new URL("../", tag.src);
  const at = (relative) => new URL(relative, root).href;

  /* A page's identity is its path with any trailing index.html removed, so a
     server that serves mockups/foo/ and one that serves mockups/foo/index.html
     both resolve to the same entry. */
  const identity = (href) => new URL(href).pathname.replace(/index\.html$/, "");

  /* The run is: the two reference pages, then every mockup of every system,
     newest system version first. A mockup's label carries its system, because
     the same mockup family usually exists under more than one. */
  const buildPages = (systems) => {
    const ordered = [...systems].sort((a, b) =>
      a.family === b.family ? b.version - a.version : a.family.localeCompare(b.family));

    const mockups = ordered.flatMap((s) =>
      (s.mockups ?? []).map((m) => ({
        href: at(m.href),
        title: `${m.title} — ${s.name} v${s.version}`
      })));

    return [
      { href: at("system/preview.html"), title: "System preview" },
      { href: at("docs/how-to-use.html"), title: "How to use" },
      ...mockups
    ];
  };

  const link = (label, href, ariaLabel) => {
    const a = document.createElement("a");
    a.className = "vp-nav__link";
    a.textContent = label;
    if (ariaLabel) a.setAttribute("aria-label", ariaLabel);
    if (href) {
      a.href = href;
    } else {
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("role", "link");
    }
    return a;
  };

  const render = (systems) => {
    const pages = buildPages(systems);
    const here = identity(location.href);
    const index = pages.findIndex((p) => identity(p.href) === here);

    const prev = index > 0 ? pages[index - 1] : null;
    const next = index !== -1 && index < pages.length - 1 ? pages[index + 1] : null;

    const nav = document.createElement("nav");
    nav.className = "vp-nav";
    nav.setAttribute("aria-label", "Review navigation");

    nav.append(link("← Gallery", at("index.html"), "Back to the gallery"));

    if (index !== -1) {
      const divider = document.createElement("span");
      divider.className = "vp-nav__divider";

      const here_ = document.createElement("span");
      here_.className = "vp-nav__here";
      here_.innerHTML =
        `<span class="vp-nav__count">${index + 1} of ${pages.length}</span>` +
        `<span class="vp-nav__title"></span>`;
      // textContent, not innerHTML — a mockup title is arbitrary text.
      here_.querySelector(".vp-nav__title").textContent = pages[index].title;

      const spacer = document.createElement("span");
      spacer.className = "u-spacer";

      const hint = document.createElement("span");
      hint.className = "vp-nav__hint";
      hint.innerHTML = "<kbd>←</kbd> <kbd>→</kbd> to page";

      nav.append(
        divider,
        link("Prev", prev?.href, prev ? `Previous: ${prev.title}` : "No previous page"),
        here_,
        link("Next", next?.href, next ? `Next: ${next.title}` : "No next page"),
        spacer,
        hint
      );
    }

    document.body.prepend(nav);

    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Arrow keys belong to whatever is focused — a slider, a text field, a
      // tree. Only page when nothing is claiming them.
      const el = document.activeElement;
      if (el && (el.matches("input, select, textarea") || el.isContentEditable)) return;

      if (e.key === "ArrowLeft" && prev) location.href = prev.href;
      if (e.key === "ArrowRight" && next) location.href = next.href;
      if (e.key === "Escape") location.href = at("index.html");
    });
  };

  /* The manifest is a plain script rather than JSON so it loads over file://.
     Most pages already load it for use-tokens.js, so this usually finds it
     in memory. If it cannot be read the bar still renders — just without the
     mockups. */
  const start = () => {
    if (Array.isArray(window.VP_SYSTEMS)) {
      render(window.VP_SYSTEMS);
      return;
    }
    const manifest = document.createElement("script");
    manifest.src = at("systems/manifest.js");
    manifest.onload = () => render(window.VP_SYSTEMS ?? []);
    manifest.onerror = () => render([]);
    document.head.append(manifest);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
