/* ==========================================================================
   Viewport Universal UI — Tile rendering
   --------------------------------------------------------------------------
   Shared by the read-only overview (index.html) and the studio. The studio
   passes `actions: true` to get the create / version / delete buttons; the
   markup is otherwise identical, so the two views cannot drift apart.

   Exposed as window.VPTiles — a plain script, no modules, so it loads over
   file:// as happily as over http.
   ========================================================================== */

(() => {
  "use strict";

  /** Everything interpolated below is user-entered — a system name, a mockup
   *  title — so every value goes through this. */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const STATUS_TONE = {
    draft: "vp-badge--caution",
    review: "vp-badge--accent",
    approved: "vp-badge--positive",
    reference: "vp-badge--accent",
    superseded: "",
  };

  const DEVICE_WIDTH = {
    "ipad-landscape": 1366, "ipad-portrait": 1024, desktop: 1440,
    "desktop-wide": 1920, headset: 1280, phone: 393,
  };

  const DEVICE_HEIGHT = {
    "ipad-landscape": 1024, "ipad-portrait": 1366, desktop: 900,
    "desktop-wide": 1080, headset: 800, phone: 852,
  };

  const fact = (label, value) =>
    `<span class="vp-tile__fact">
       <span class="vp-tile__factlabel">${esc(label)}</span>
       <span class="vp-tile__factvalue">${esc(value)}</span>
     </span>`;

  const btn = (label, action, id, extra = "") =>
    `<button class="vp-btn vp-btn--secondary" type="button"
             data-action="${esc(action)}" data-id="${esc(id)}" ${extra}>${esc(label)}</button>`;

  const DEVICE_LABEL = {
    phone: "Phone",
    "ipad-portrait": "iPad — portrait",
    "ipad-landscape": "iPad — landscape",
    desktop: "Desktop",
    "desktop-wide": "Desktop — wide",
    headset: "Headset",
  };

  /**
   * A mockup card: ONE tile per idea, holding a thumbnail per screen type.
   * The thumbnails are the live screens in scaled iframes rather than stored
   * screenshots, which would need regenerating on every token change and would
   * quietly go stale between times.
   */
  const mockupTile = (m, { base = "", systemId = "", actions = false, systemName = "", renderAs = "" } = {}) => {
    // renderAs lets one view show every mockup under a single chosen system,
    // rather than each under the one it happens to live in.
    const retarget = renderAs && renderAs !== systemId ? renderAs : "";
    const q = (extra) => {
      const parts = [];
      if (extra) parts.push(extra);
      if (retarget) parts.push(`system=${encodeURIComponent(retarget)}`);
      return parts.length ? `?${parts.join("&")}` : "";
    };

    const screens = m.screens ?? [];

    const screenCell = (sc) => {
      const w = DEVICE_WIDTH[sc.device] ?? 1366;
      const h = DEVICE_HEIGHT[sc.device] ?? 1024;
      return `
        <a class="vp-screen" href="${esc(base + sc.href + q(""))}" title="${esc(sc.title)}">
          <span class="vp-screen__shot" data-ratio="${(w / h).toFixed(3)}">
            <iframe src="${esc(base + sc.href + q("chrome=0"))}" loading="lazy" tabindex="-1"
                    aria-hidden="true" scrolling="no" data-fit-w="${w}" data-fit-h="${h}"></iframe>
          </span>
          <span class="vp-screen__meta">
            <span class="vp-screen__device">${esc(DEVICE_LABEL[sc.device] ?? sc.device)}</span>
            <span class="vp-screen__title">${esc(sc.title)}</span>
          </span>
        </a>`;
    };

    return `
      <article class="vp-mockup" data-mockup="${esc(m.id)}">
        <header class="vp-mockup__head">
          <span class="u-grow">
            <span class="vp-mockup__title">${esc(m.title)}</span>
            <span class="vp-mockup__sub"> · v${esc(m.version)}</span>
          </span>
          <span class="vp-badge ${STATUS_TONE[m.status] ?? ""}">${esc(m.status)}</span>
          ${systemName ? `<span class="vp-badge vp-badge--accent">${esc(systemName)}</span>` : ""}
        </header>

        ${m.summary ? `<p class="vp-mockup__summary">${esc(m.summary)}</p>` : ""}

        ${screens.length
          ? `<div class="vp-screens">${screens.map(screenCell).join("")}</div>`
          : `<p class="vp-empty">No screens in this mockup.</p>`}

        ${actions ? `<div class="vp-mockup__actions">
          ${btn("Add screen", "screen-new", m.id, `data-system="${esc(systemId)}"`)}
          ${btn("New version", "mockup-version", m.id, `data-system="${esc(systemId)}"`)}
          ${btn("Delete", "mockup-delete", m.id, `data-system="${esc(systemId)}"`)}
        </div>` : ""}
      </article>`;
  };

  const systemTile = (s, { base = "", actions = false } = {}) => {
    const mockups = s.mockups ?? [];
    const swatch = (token, wide) =>
      `<span class="vp-tile__swatch${wide ? " vp-tile__swatch--wide" : ""}"
             style="background:${esc(token)}"></span>`;

    return `
      <article class="vp-tile${s.isLatest ? "" : " vp-tile--muted"}" data-system="${esc(s.id)}">
        <header class="vp-tile__head">
          <span class="u-grow">
            <span class="vp-tile__name">${esc(s.name)}</span>
            <span class="vp-tile__sub"> · v${esc(s.version)}${s.isLatest ? " · latest" : ""}</span>
          </span>
        </header>

        <div class="vp-tile__swatches" aria-hidden="true">
          ${swatch(s.accent, true)}
          ${swatch(s.surfaces?.[0] ?? "var(--surface-0)")}
          ${swatch(s.surfaces?.[1] ?? "var(--surface-1)")}
          ${swatch(s.surfaces?.[2] ?? "var(--surface-2)")}
          ${swatch(s.surfaces?.[3] ?? "var(--surface-raised)")}
        </div>

        <div class="vp-tile__facts">
          ${fact("Accent", s.accent ?? "—")}
          ${fact("Mockups", String(mockups.length))}
          ${fact("Line weight", s.lineWeight ? `${s.lineWeight}px` : "—")}
          ${fact("Updated", s.updated || "—")}
        </div>

        <div class="vp-tile__actions">
          <a class="vp-btn vp-btn--secondary" href="${base}system/preview.html?system=${esc(s.id)}">Elements</a>
          ${actions ? `
            <a class="vp-btn vp-btn--primary" href="system.html?id=${esc(s.id)}">Open</a>
            ${btn("New version", "system-version", s.id)}
            ${btn("Delete", "system-delete", s.id)}
          ` : ""}
        </div>
      </article>`;
  };

  /** Scale every thumbnail iframe so a full device viewport fits its frame. */
  const fitThumbnails = (scope = document) => {
    scope.querySelectorAll(".vp-screen__shot").forEach((shot) => {
      const frame = shot.querySelector("iframe");
      if (!frame) return;
      const w = Number(frame.dataset.fitW) || 1366;
      const h = Number(frame.dataset.fitH) || 1024;
      const box = shot.getBoundingClientRect();
      if (!box.width) return;
      const scale = Math.min(box.width / w, box.height / h);
      frame.style.width = `${w}px`;
      frame.style.height = `${h}px`;
      frame.style.transform = `scale(${scale})`;
      // Centre it in the band rather than pinning it to the corner.
      frame.style.left = `${(box.width - w * scale) / 2}px`;
      frame.style.top = `${(box.height - h * scale) / 2}px`;
    });
  };

  let pending;
  const scheduleFit = () => {
    clearTimeout(pending);
    pending = setTimeout(() => fitThumbnails(), 60);
  };

  window.addEventListener("resize", scheduleFit);
  window.addEventListener("load", scheduleFit);

  // Tiles are usually written into the DOM right after this script runs, so
  // watch for them rather than requiring every caller to remember to fit.
  new MutationObserver(scheduleFit).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.VPTiles = { esc, systemTile, mockupTile, fitThumbnails, DEVICE_WIDTH, DEVICE_HEIGHT };
})();
