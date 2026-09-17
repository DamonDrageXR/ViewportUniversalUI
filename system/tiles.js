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

  /**
   * A mockup card. The thumbnail is the live mockup in a scaled iframe rather
   * than a stored screenshot — a screenshot would need regenerating on every
   * token change and would quietly go stale between times.
   */
  const mockupTile = (m, { base = "", systemId = "", actions = false } = {}) => {
    const href = `${base}${m.href}`;
    // The tile links to the full page but embeds the bare one.
    const thumb = `${href}?chrome=0`;
    const w = DEVICE_WIDTH[m.device] ?? 1366;
    const h = DEVICE_HEIGHT[m.device] ?? 1024;

    return `
      <div class="vp-mockup" data-mockup="${esc(m.id)}">
        <a class="vp-mockup__shot" href="${esc(href)}" title="${esc(m.title)}">
          <iframe src="${esc(thumb)}" loading="lazy" tabindex="-1" aria-hidden="true"
                  scrolling="no" data-fit-w="${w}" data-fit-h="${h}"></iframe>
        </a>
        <div class="vp-mockup__meta">
          <span class="vp-mockup__title">${esc(m.title)}</span>
          <span class="vp-mockup__tags">
            <span class="vp-badge">v${esc(m.version)}</span>
            <span class="vp-badge ${STATUS_TONE[m.status] ?? ""}">${esc(m.status)}</span>
          </span>
        </div>
        ${actions ? `<div class="vp-mockup__actions">
          ${btn("Version", "mockup-version", m.id, `data-system="${esc(systemId)}"`)}
          ${btn("Delete", "mockup-delete", m.id, `data-system="${esc(systemId)}"`)}
        </div>` : ""}
      </div>`;
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
          ${fact("Updated", s.updated || "—")}
        </div>

        <div class="vp-tile__body">
          <span class="vp-tile__label">${mockups.length} mockup${mockups.length === 1 ? "" : "s"}</span>
          ${mockups.length
            ? `<div class="vp-mockups">${mockups.map((m) =>
                mockupTile(m, { base, systemId: s.id, actions })).join("")}</div>`
            : `<p class="vp-empty">None yet${actions ? " — add one below" : ""}.</p>`}
        </div>

        <div class="vp-tile__actions">
          <a class="vp-btn vp-btn--secondary" href="${base}system/preview.html?system=${esc(s.id)}">Tokens</a>
          ${actions ? `
            <a class="vp-btn vp-btn--primary" href="system.html?id=${esc(s.id)}">Edit</a>
            ${btn("New version", "system-version", s.id)}
            ${btn("New mockup", "mockup-new", s.id)}
            ${btn("Delete", "system-delete", s.id)}
          ` : ""}
        </div>
      </article>`;
  };

  /** Scale every thumbnail iframe so a full device viewport fits its frame. */
  const fitThumbnails = (scope = document) => {
    scope.querySelectorAll(".vp-mockup__shot iframe").forEach((frame) => {
      const box = frame.parentElement.getBoundingClientRect();
      if (!box.width) return;
      const w = Number(frame.dataset.fitW) || 1366;
      const h = Number(frame.dataset.fitH) || 1024;
      const scale = Math.min(box.width / w, box.height / h);
      frame.style.width = `${w}px`;
      frame.style.height = `${h}px`;
      frame.style.transform = `scale(${scale})`;
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
