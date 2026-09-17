/* ==========================================================================
   Viewport Universal UI — Inspector
   --------------------------------------------------------------------------
   Click any element in a mockup and edit the tokens it actually resolves to.

   How an element is mapped back to tokens: every token on :root is read once
   and normalised into a lookup keyed by its *resolved* value. The clicked
   element's computed styles are normalised the same way, so a panel whose
   background computes to rgb(21 24 30) is matched to --surface-2 rather than
   being offered as a loose colour to type over. That is what keeps an edit a
   system change instead of a one-off patch on one element.

   Each property offers only the control its type allows — a colour gets a
   colour picker, a radius gets a length slider. Dormant unless the studio
   server is answering, because otherwise there is nowhere to save to.
   ========================================================================== */

(() => {
  "use strict";

  const tag = document.currentScript || document.querySelector('script[src*="inspector.js"]');
  if (!tag) return;

  // ?chrome=0 suppresses review chrome. The studio's live preview embeds real
  // pages, and a nav bar inside a 300px preview is noise, not navigation.
  if (new URLSearchParams(location.search).get("chrome") === "0") return;

  const root = new URL("../", tag.src);

  /* Which computed properties are worth offering, and what kind of value each
     one holds. The kind decides the control, so a font-size can never be
     handed a colour picker. */
  const PROPS = [
    { css: "background-color", label: "Background", kind: "color", prefer: /surface|accent|status/ },
    { css: "color", label: "Text colour", kind: "color", prefer: /^--text-(?!xs|sm|base|lg|xl|2xl|3xl)|-fg$|^--accent$/ },
    { css: "border-top-color", label: "Border colour", kind: "color", prefer: /border/ },
    { css: "border-top-left-radius", label: "Corner radius", kind: "length", min: 0, max: 40, prefer: /radius/ },
    { css: "font-size", label: "Text size", kind: "length", min: 9, max: 72, prefer: /^--text-/ },
    { css: "font-family", label: "Font", kind: "font" },
    { css: "padding-top", label: "Padding", kind: "length", min: 0, max: 96, prefer: /space/ },
    { css: "gap", label: "Gap", kind: "length", min: 0, max: 96, prefer: /space/ },
    { css: "min-height", label: "Min height", kind: "length", min: 0, max: 120, prefer: /hit|thickness|width/ },
  ];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /** Colours arrive as hex from a token and rgb() from a computed style, so
   *  both are flattened to "r,g,b" before comparing. */
  const normalise = (value, kind) => {
    const v = String(value ?? "").trim();
    if (!v) return "";
    if (kind === "color") {
      if (v.startsWith("#")) {
        const h = v.length === 4 ? v.slice(1).split("").map((c) => c + c).join("") : v.slice(1, 7);
        const n = Number.parseInt(h, 16);
        return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}@1`;
      }
      const nums = v.match(/\d+(\.\d+)?/g);
      if (!nums || nums.length < 3) return "";
      const alpha = nums.length > 3 ? Number(nums[3]) : 1;
      // Fully transparent is not a match for anything useful.
      if (alpha === 0) return "";
      return nums.slice(0, 3).map((x) => Math.round(Number(x))).join(",") + `@${alpha}`;
    }
    if (kind === "length") {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) ? `${n}px` : "";
    }
    return v.replace(/\s+/g, " ");
  };

  const toHex = (value) => {
    const n = normalise(value, "color").split("@")[0].split(",").map(Number);
    if (n.length < 3 || n.some((x) => !Number.isFinite(x))) return "#000000";
    return "#" + n.map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const state = { on: false, api: false, systemId: null, el: null, pending: {} };

  /* ---- Token lookup ------------------------------------------------------ */

  const tokenIndex = () => {
    const cs = getComputedStyle(document.documentElement);
    const index = { color: new Map(), length: new Map(), font: new Map() };

    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (!rule.style) continue;
        for (const name of rule.style) {
          if (!name.startsWith("--")) continue;
          const raw = cs.getPropertyValue(name).trim();
          if (!raw) continue;
          for (const kind of ["color", "length", "font"]) {
            const key = normalise(raw, kind);
            if (!key) continue;
            if (kind === "color" && !/^#|^rgb/i.test(raw)) continue;
            if (kind === "length" && !/^-?[\d.]+px$/.test(raw)) continue;
            if (kind === "font" && !raw.includes(",")) continue;
            if (!index[kind].has(key)) index[kind].set(key, []);
            const bucket = index[kind].get(key);
            if (!bucket.includes(name)) bucket.push(name);
          }
        }
      }
    }
    return index;
  };

  let index = null;

  /* ---- Panel ------------------------------------------------------------- */

  const describe = (el) => {
    const cls = typeof el.className === "string"
      ? el.className.split(" ").filter((c) => c.startsWith("vp-")).slice(0, 2).join(".")
      : "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`;
  };

  const control = (prop, token, value) => {
    const ctx = `data-token="${esc(token)}" data-kind="${esc(prop.kind)}"`;
    if (prop.kind === "color") {
      const hex = toHex(value);
      return `<div class="vp-insp__controls">
        <input type="color" class="vp-insp__swatch" value="${esc(hex)}" ${ctx} aria-label="${esc(prop.label)}">
        <input type="text" class="vp-input vp-insp__hex u-grow" value="${esc(hex)}" ${ctx} data-text="1"
               spellcheck="false" aria-label="${esc(prop.label)} hex">
      </div>`;
    }
    if (prop.kind === "length") {
      const n = Number.parseFloat(value) || 0;
      return `<div class="vp-insp__controls">
        <input type="range" class="vp-slider u-grow" min="${prop.min}" max="${prop.max}" step="1"
               value="${n}" ${ctx} aria-label="${esc(prop.label)}">
        <input type="number" class="vp-input vp-insp__num" min="${prop.min}" max="${prop.max}" step="1"
               value="${n}" ${ctx} data-text="1" aria-label="${esc(prop.label)} value">
      </div>`;
    }
    return `<div class="vp-insp__controls">
      <span class="vp-insp__note u-grow">Edit this in the studio's Fonts group.</span>
    </div>`;
  };

  const renderPanel = (el) => {
    const panel = document.querySelector(".vp-insp");
    const cs = getComputedStyle(el);
    index ??= tokenIndex();

    const rows = [];
    const seen = new Set();

    for (const prop of PROPS) {
      const raw = cs.getPropertyValue(prop.css);
      const key = normalise(raw, prop.kind);
      if (!key) continue;
      const candidates = index[prop.kind]?.get(key) ?? [];
      // Several tokens can share a value — 8px is both --radius-md and
      // --space-2. The property says which family it means.
      const token = (prop.prefer && candidates.find((c) => prop.prefer.test(c))) || candidates[0];
      if (!token || seen.has(token)) continue;
      seen.add(token);
      rows.push(`
        <div class="vp-insp__row">
          <span class="vp-insp__prop">${esc(prop.label)}</span>
          <span class="vp-insp__token">${esc(token)}</span>
          ${control(prop, token, raw)}
        </div>`);
    }

    panel.querySelector(".vp-insp__target").textContent = describe(el);
    panel.querySelector(".vp-insp__body").innerHTML = rows.length
      ? rows.join("")
      : `<p class="vp-insp__note">Nothing on this element resolves to a token — it is probably
         inheriting from a parent. Click the panel or surface behind it instead.</p>`;
  };

  /* ---- Applying and saving ----------------------------------------------- */

  const apply = (token, value) => {
    document.documentElement.style.setProperty(token, value);
    // Colours belong to the theme being viewed; sizes are shared between both.
    const scope = /color|surface|text-|accent|status|border/.test(token) &&
      !/--text-(xs|sm|base|lg|xl|2xl|3xl)/.test(token)
      ? (document.documentElement.getAttribute("data-theme") || "dark")
      : "shared";
    state.pending[scope] ??= {};
    state.pending[scope][token] = value;
    const save = document.querySelector('[data-insp="save"]');
    save.disabled = false;
    save.textContent = `Save ${Object.values(state.pending).reduce((n, o) => n + Object.keys(o).length, 0)} change(s)`;
  };

  const save = async () => {
    const btn = document.querySelector('[data-insp="save"]');
    try {
      btn.disabled = true;
      const current = await (await fetch("/api/state")).json();
      const sys = current.systems.find((s) => s.id === state.systemId);
      if (!sys) throw new Error(`System ${state.systemId} not found`);

      const overrides = structuredClone(sys.overrides ?? {});
      for (const [scope, tokens] of Object.entries(state.pending)) {
        overrides[scope] ??= {};
        Object.assign(overrides[scope], tokens);
      }

      const res = await fetch(`/api/systems/${state.systemId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");

      state.pending = {};
      btn.textContent = "Saved";
      setTimeout(() => { btn.textContent = "No changes"; }, 1600);
      index = null;
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Save failed — retry";
    }
  };

  /* ---- Wiring ------------------------------------------------------------ */

  const highlight = document.createElement("div");
  highlight.className = "vp-insp-highlight";
  highlight.hidden = true;

  const buildPanel = () => {
    const panel = document.createElement("aside");
    panel.className = "vp-insp";
    panel.hidden = true;
    panel.innerHTML = `
      <header class="vp-insp__head">
        <span class="vp-insp__title">Inspect</span>
        <span class="vp-insp__target u-grow">—</span>
        <button class="vp-btn vp-btn--ghost" type="button" data-insp="close" aria-label="Close inspector">✕</button>
      </header>
      <div class="vp-insp__body"></div>
      <footer class="vp-insp__foot">
        <button class="vp-btn vp-btn--primary u-grow" type="button" data-insp="save" disabled>No changes</button>
      </footer>`;
    document.body.append(panel, highlight);
    return panel;
  };

  const setActive = (on) => {
    state.on = on;
    document.body.classList.toggle("vp-inspecting", on);
    document.querySelector(".vp-insp").hidden = !on;
    highlight.hidden = true;
    const toggle = document.querySelector('[data-insp="toggle"]');
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(on));
      toggle.classList.toggle("vp-btn--primary", on);
      toggle.classList.toggle("vp-btn--secondary", !on);
    }
  };

  const start = async () => {
    // Dormant without the studio server — there would be nowhere to save.
    // Checked before fetching: on file:// the request fails at the network
    // layer and the browser logs it whether or not we catch the rejection.
    if (!location.protocol.startsWith("http")) return;
    try {
      const res = await fetch("/api/state", { method: "GET" });
      if (!res.ok) return;
      state.api = true;
    } catch { return; }

    state.systemId = document.documentElement.dataset.system;
    if (!state.systemId) return;

    buildPanel();

    const bar = document.querySelector(".vp-nav") || document.querySelector(".stage__bar");
    if (bar) {
      const toggle = document.createElement("button");
      toggle.className = "vp-btn vp-btn--secondary";
      toggle.type = "button";
      toggle.dataset.insp = "toggle";
      toggle.textContent = "Inspect";
      toggle.setAttribute("aria-pressed", "false");
      bar.append(toggle);
    }

    document.addEventListener("click", (e) => {
      const act = e.target.closest("[data-insp]");
      if (act) {
        if (act.dataset.insp === "toggle") { setActive(!state.on); return; }
        if (act.dataset.insp === "close") { setActive(false); return; }
        if (act.dataset.insp === "save") { save(); return; }
      }
      if (!state.on) return;
      if (e.target.closest(".vp-insp")) return;
      e.preventDefault();
      e.stopPropagation();
      state.el = e.target;
      renderPanel(e.target);
    }, true);

    document.addEventListener("mousemove", (e) => {
      if (!state.on || e.target.closest(".vp-insp")) { highlight.hidden = true; return; }
      const r = e.target.getBoundingClientRect();
      Object.assign(highlight.style, {
        top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px`,
      });
      highlight.hidden = false;
    });

    document.addEventListener("input", (e) => {
      const el = e.target.closest(".vp-insp [data-token]");
      if (!el) return;
      const { token, kind } = el.dataset;
      let value;
      if (kind === "color") {
        if (el.dataset.text && !/^#[0-9a-f]{6}$/i.test(el.value.trim())) return;
        value = el.value.trim();
      } else {
        value = `${Number.parseFloat(el.value) || 0}px`;
      }
      el.closest(".vp-insp__controls").querySelectorAll("[data-token]").forEach((p) => {
        if (p !== el) p.value = kind === "color" ? value : Number.parseFloat(value);
      });
      apply(token, value);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.on) setActive(false);
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
