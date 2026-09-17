/* ==========================================================================
   Viewport Universal UI — Icon set
   --------------------------------------------------------------------------
   A single inline SVG sprite, injected once per page. Use an icon with:

     <svg class="vp-icon" aria-hidden="true"><use href="#i-measure"></use></svg>

   Line icons on a 24px grid, drawn without their own stroke-width so they
   inherit `--stroke-icon` from the system. Turn the system's line weight up
   and the icons thicken with it instead of staying spindly against the new
   borders.

   Inline rather than an icon font or separate file: no network fetch, no
   licence, and it works from file://.
   ========================================================================== */

(() => {
  "use strict";

  const PATHS = {
    // Navigation and view
    "i-pan": '<path d="M12 3v18M3 12h18"/><path d="m8 7 4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
    "i-orbit": '<ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="9"/><circle cx="12" cy="12" r="1.5"/>',
    "i-zoom": '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5M8 11h6"/>',
    "i-fit": '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    "i-location": '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    "i-compass": '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5z"/>',

    // Tools
    "i-measure": '<path d="m3 17 14-14 4 4L7 21z"/><path d="M8 8l2 2M11 5l2 2M5 11l2 2"/>',
    "i-marker": '<path d="M12 21V8"/><path d="M12 8h7l-2 3 2 3h-7"/><circle cx="12" cy="21" r="1"/>',
    "i-section": '<path d="M3 12h18"/><path d="M6 6h12v12H6z" stroke-dasharray="3 3"/>',
    "i-draw": '<path d="M3 21v-4L16 4l4 4L7 21z"/><path d="m14 6 4 4"/>',
    "i-erase": '<path d="M8 20H4l-1-4 11-11 6 6-8 8z"/><path d="M21 20H10"/>',
    "i-camera": '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',

    // Data and layers
    "i-layers": '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    "i-folder": '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    "i-eye": '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.8"/>',
    "i-eye-off": '<path d="M3 3l18 18"/><path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.5 8.3A17 17 0 0 0 2 12s3.6 6 10 6a9.6 9.6 0 0 0 3.2-.5"/>',
    "i-lock": '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    "i-grid": '<path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',

    // Actions
    "i-plus": '<path d="M12 5v14M5 12h14"/>',
    "i-minus": '<path d="M5 12h14"/>',
    "i-check": '<path d="m4 12 5 5L20 6"/>',
    "i-close": '<path d="M6 6l12 12M18 6 6 18"/>',
    "i-trash": '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    "i-undo": '<path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="m8 5-4 4 4 4"/>',
    "i-redo": '<path d="M20 9H9a5 5 0 0 0 0 10h7"/><path d="m16 5 4 4-4 4"/>',
    "i-download": '<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
    "i-share": '<circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    "i-search": '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',

    // Chrome
    "i-settings": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    "i-menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "i-more": '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    "i-chevron-right": '<path d="m9 5 7 7-7 7"/>',
    "i-chevron-down": '<path d="m5 9 7 7 7-7"/>',
    "i-info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    "i-warning": '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
    "i-sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  };

  const NS = "http://www.w3.org/2000/svg";

  const inject = () => {
    if (document.getElementById("vp-icon-sprite")) return;

    const sprite = document.createElementNS(NS, "svg");
    sprite.id = "vp-icon-sprite";
    sprite.setAttribute("aria-hidden", "true");
    sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";

    for (const [id, d] of Object.entries(PATHS)) {
      const symbol = document.createElementNS(NS, "symbol");
      symbol.id = id;
      symbol.setAttribute("viewBox", "0 0 24 24");
      symbol.setAttribute("fill", "none");
      symbol.setAttribute("stroke", "currentColor");
      symbol.setAttribute("stroke-linecap", "round");
      symbol.setAttribute("stroke-linejoin", "round");
      symbol.innerHTML = d;
      sprite.append(symbol);
    }

    document.body.prepend(sprite);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();

  window.VPIcons = { names: Object.keys(PATHS), inject };
})();
