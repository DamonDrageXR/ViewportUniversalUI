/* ==========================================================================
   Studio — the system editor
   --------------------------------------------------------------------------
   Builds every control from system/schema.json. Nothing here knows what a
   "colour palette" or a "type scale" is: a group declares its `control`, and
   that decides the widget. So a colour group can only ever offer colour
   controls, and adding a token to the schema adds it to the editor with no
   code change.

   Derivation happens on the server (POST /api/preview) rather than being
   reimplemented here, so there is exactly one definition of what a global
   cascades into.
   ========================================================================== */

(() => {
  "use strict";

  const { api, toast, fail, confirmDelete } = window.Studio;
  const esc = window.VPTiles.esc;

  const params = new URLSearchParams(location.search);
  const systemId = params.get("id");

  const state = {
    schema: null,
    system: null,
    draft: null,     // { name, note, globals, rules, overrides }
    resolved: null,
    theme: "dark",   // replaced at boot by the system's own primary theme
    themes: ["dark", "light"],
    dirty: false,
    previewTarget: "system",
  };

  /* ---- Value parsing ----------------------------------------------------- */

  const toHex = (value) => {
    const v = String(value ?? "").trim();
    if (v.startsWith("#")) return v.length === 4
      ? "#" + v.slice(1).split("").map((c) => c + c).join("")
      : v.slice(0, 7);
    const nums = v.match(/\d+(\.\d+)?/g);
    if (!nums || nums.length < 3) return "#000000";
    return "#" + nums.slice(0, 3)
      .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0")).join("");
  };

  const toNumber = (value) => {
    const n = Number.parseFloat(String(value ?? ""));
    return Number.isFinite(n) ? n : 0;
  };

  const fontValue = (stack) =>
    state.schema.fonts.find((f) => f.stack === stack)?.value ?? "";

  /** Which slice of the override map a group writes into. Colours are
   *  per-theme; everything else is shared between themes. */
  const scopeOf = (group) => (group.control === "color" ? state.theme : "shared");

  const resolvedValue = (scope, token) => state.resolved?.[scope]?.[token] ?? "";

  const overrideOf = (scope, token) => state.draft.overrides?.[scope]?.[token];

  /* ---- Editing ----------------------------------------------------------- */

  let previewTimer;

  const touched = () => {
    state.dirty = true;
    document.getElementById("dirty").hidden = false;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 180);
  };

  const setGlobal = (id, value) => {
    state.draft.globals[id] = value;
    touched();
    refreshPreview().then(renderAll);
  };

  const setOverride = (scope, token, value) => {
    state.draft.overrides[scope] ??= {};
    state.draft.overrides[scope][token] = value;
    touched();
  };

  const clearOverride = (scope, token) => {
    if (state.draft.overrides[scope]) delete state.draft.overrides[scope][token];
    touched();
    refreshPreview().then(renderAll);
  };

  /* ---- Controls ----------------------------------------------------------
     One factory per control kind. `spec` carries the constraints from the
     schema; `ctx` says where the value comes from and where it goes. */

  const CONTROLS = {
    color: (spec, value, ctx) => `
      <div class="field__row">
        <input type="color" class="swatch-input" value="${esc(toHex(value))}" ${ctx} data-kind="color"
               aria-label="${esc(spec.label)} colour">
        <input type="text" class="vp-input hex-input" value="${esc(toHex(value))}" ${ctx} data-kind="color-text"
               spellcheck="false" aria-label="${esc(spec.label)} hex">
      </div>`,

    length: (spec, value, ctx) => `
      <div class="field__row">
        <input type="range" class="vp-slider u-grow" min="${spec.min ?? 0}" max="${spec.max ?? 100}"
               step="${spec.step ?? 1}" value="${toNumber(value)}" ${ctx} data-kind="length"
               data-unit="${esc(spec.unit ?? "px")}" aria-label="${esc(spec.label)}">
        <input type="number" class="vp-input num-input" min="${spec.min ?? 0}" max="${spec.max ?? 100}"
               step="${spec.step ?? 1}" value="${toNumber(value)}" ${ctx} data-kind="length"
               data-unit="${esc(spec.unit ?? "px")}" aria-label="${esc(spec.label)} value">
      </div>`,

    duration: (spec, value, ctx) => CONTROLS.length({ ...spec, unit: spec.unit ?? "ms" }, value, ctx),

    number: (spec, value, ctx) => `
      <div class="field__row">
        <input type="range" class="vp-slider u-grow" min="${spec.min ?? 0}" max="${spec.max ?? 100}"
               step="${spec.step ?? 1}" value="${toNumber(value)}" ${ctx} data-kind="number"
               aria-label="${esc(spec.label)}">
        <input type="number" class="vp-input num-input" min="${spec.min ?? 0}" max="${spec.max ?? 100}"
               step="${spec.step ?? 1}" value="${toNumber(value)}" ${ctx} data-kind="number"
               aria-label="${esc(spec.label)} value">
      </div>`,

    alpha: (spec, value, ctx) => CONTROLS.number({ ...spec, min: spec.min ?? 0, max: spec.max ?? 1, step: spec.step ?? 0.01 }, value, ctx),

    hue: (spec, value, ctx) => `
      <div class="field__row">
        <input type="range" class="vp-slider hue-input u-grow" min="0" max="360" step="1"
               value="${toNumber(value)}" ${ctx} data-kind="number" aria-label="${esc(spec.label)}">
        <input type="number" class="vp-input num-input" min="0" max="360" step="1"
               value="${toNumber(value)}" ${ctx} data-kind="number" aria-label="${esc(spec.label)} value">
      </div>`,

    font: (spec, value, ctx) => {
      const variant = spec.variant === "mono" ? "mono" : "sans";
      const options = state.schema.fonts.filter((f) =>
        variant === "mono" ? f.variant === "mono" : f.variant !== "mono");
      const current = String(value ?? "").startsWith("\"") || String(value ?? "").includes(",")
        ? fontValue(value) : value;
      return `
        <div class="field__row">
          <select class="vp-input u-grow" ${ctx} data-kind="font" aria-label="${esc(spec.label)}">
            ${options.map((f) => `<option value="${esc(f.value)}" ${f.value === current ? "selected" : ""}
              style="font-family:${esc(f.stack)}">${esc(f.label)}</option>`).join("")}
          </select>
        </div>`;
    },

    select: (spec, value, ctx) => `
      <div class="field__row">
        <select class="vp-input u-grow" ${ctx} data-kind="select" aria-label="${esc(spec.label)}">
          ${spec.options.map((o) => `<option value="${esc(o.value)}" ${o.value === value ? "selected" : ""}>${esc(o.label)}</option>`).join("")}
        </select>
      </div>`,
  };

  const field = (spec, value, ctx, { tokenName = "", custom = false } = {}) => {
    const control = CONTROLS[spec.control] ?? CONTROLS.number;
    return `
      <div class="field">
        <div class="field__head">
          <span class="field__label">${esc(spec.label)}</span>
          ${custom ? `<button class="field__custom" type="button" data-reset="${esc(tokenName)}"
                        title="This value is pinned and no longer follows the globals">custom · reset</button>` : ""}
        </div>
        ${control(spec, value, ctx)}
        ${tokenName ? `<span class="token-name">${esc(tokenName)}</span>` : ""}
        ${spec.note ? `<span class="field__note">${esc(spec.note)}</span>` : ""}
      </div>`;
  };

  /** Keeps the theme button honest about what it can do. */
  const syncThemeButton = () => {
    const btn = document.querySelector('[data-act="theme"]');
    if (!btn) return;
    const single = state.themes.length < 2;
    btn.textContent = single ? `${cap(state.theme)} only` : `Editing: ${state.theme}`;
    btn.disabled = single;
    btn.title = single
      ? `This system is ${state.theme}-only, so there is no other theme to edit.`
      : "Switch which theme's colours you are editing";
  };

  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

  /* ---- Rendering --------------------------------------------------------- */

  const renderGlobals = () => {
    document.getElementById("globals").innerHTML = state.schema.globals.map((g) =>
      field(g, state.draft.globals[g.id], `data-global="${esc(g.id)}"`)
    ).join("");
  };

  /* Rules are the structural decisions a token cannot carry — whether a
     treatment is allowed at all, rather than what value it takes. They are
     rendered from schema.rules exactly as the token groups are, so adding a
     rule to the schema is all it takes to make it editable here. */
  const renderRules = () => {
    const host = document.getElementById("rules");
    if (!host) return;
    const rules = state.schema.rules ?? [];
    if (!rules.length) { host.innerHTML = ""; return; }
    host.innerHTML = rules.map((r) =>
      field(r, state.draft.rules?.[r.id] ?? r.default, `data-rule="${esc(r.id)}"`)
    ).join("");
  };

  const renderGroups = () => {
    document.getElementById("groups").innerHTML = state.schema.groups.map((group) => {
      const scope = scopeOf(group);
      return `
        <section class="vp-panel vp-panel--solid">
          <header class="vp-panel__header">
            <h2 class="vp-panel__title">${esc(group.label)}</h2>
            <span class="u-spacer"></span>
            <span class="vp-badge">${esc(group.control)}${group.control === "color" ? ` · ${esc(state.theme)}` : ""}</span>
          </header>
          <div class="vp-panel__body">
            ${group.note ? `<p class="field__note" style="margin-bottom:var(--space-4)">${esc(group.note)}</p>` : ""}
            <div class="group__tokens">
              ${group.tokens.map((t) => {
                const spec = { ...group, ...t, control: group.control };
                const value = resolvedValue(scope, t.id);
                const ctx = `data-token="${esc(t.id)}" data-scope="${esc(scope)}"`;
                return field(spec, value, ctx, {
                  tokenName: t.id,
                  custom: overrideOf(scope, t.id) !== undefined,
                });
              }).join("")}
            </div>
          </div>
        </section>`;
    }).join("");
  };

  const renderHeader = () => {
    document.getElementById("name").value = state.draft.name;
    document.getElementById("version").textContent =
      `v${state.system.version}${state.system.derivedFrom ? ` · from ${state.system.derivedFrom}` : ""}`;
  };

  const renderMockups = () => {
    const host = document.getElementById("mockup-tiles");
    if (!host) return;
    const mockups = state.system.mockups ?? [];
    host.innerHTML = mockups.length
      ? mockups.map((m) => window.VPTiles.mockupTile(m, {
          base: "../", systemId, actions: true,
        })).join("")
      : `<p class="vp-empty">No mockups in this system yet. A mockup is one idea with a screen
         per device — phone, iPad portrait and iPad landscape are the usual three.</p>`;
  };

  const renderAll = () => { renderHeader(); renderGlobals(); renderRules(); renderGroups(); };

  /* ---- Live preview ------------------------------------------------------
     The preview is the real page in an iframe with the draft's generated CSS
     injected over it, so what you see is the same CSS that Save will write. */

  const previewSrc = () =>
    `/system/preview.html?system=${systemId}&chrome=0&view=elements`;

  /** The rule attributes the components style against, mirrored onto the
   *  preview document so a rule change shows without a reload. */
  const applyRuleAttrs = () => {
    const doc = document.getElementById("preview")?.contentDocument;
    if (!doc?.documentElement) return;
    for (const [key, value] of Object.entries(state.draft.rules ?? {})) {
      const attr = `data-rule-${key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`;
      doc.documentElement.setAttribute(attr, String(value));
    }
  };

  const inject = (css) => {
    const frame = document.getElementById("preview");
    const doc = frame.contentDocument;
    if (!doc || !doc.head) return;
    doc.documentElement.setAttribute("data-theme", state.theme);
    applyRuleAttrs();
    let style = doc.getElementById("vp-draft-tokens");
    if (!style) {
      style = doc.createElement("style");
      style.id = "vp-draft-tokens";
      doc.head.append(style);
    }
    style.textContent = css;
  };

  const refreshPreview = async () => {
    try {
      const { resolved, css } = await api("POST", "/preview", {
        globals: state.draft.globals,
        rules: state.draft.rules,
        overrides: state.draft.overrides,
      });
      state.resolved = resolved;
      inject(css);
    } catch (err) {
      fail(err);
    }
  };

  /* ---- Saving ------------------------------------------------------------ */

  const save = async ({ asNewVersion = false } = {}) => {
    try {
      let targetId = systemId;
      if (asNewVersion) {
        const created = await api("POST", `/systems/${systemId}/version`);
        targetId = created.id;
      }
      await api("PUT", `/systems/${targetId}`, {
        name: state.draft.name,
        note: state.draft.note,
        globals: state.draft.globals,
        rules: state.draft.rules,
        overrides: state.draft.overrides,
      });
      state.dirty = false;
      document.getElementById("dirty").hidden = true;

      if (asNewVersion) {
        toast(`Saved as ${targetId} — ${systemId} left untouched`, "vp-badge--positive");
        location.search = `?id=${targetId}`;
      } else {
        toast(`Saved to ${targetId}`, "vp-badge--positive");
      }
    } catch (err) {
      fail(err);
    }
  };

  /* ---- Wiring ------------------------------------------------------------ */

  const onInput = (e) => {
    const el = e.target.closest("[data-kind]");
    if (!el) return;
    const { kind, unit, token, scope } = el.dataset;
    const globalId = el.dataset.global;
    const ruleId = el.dataset.rule;

    let value;
    if (kind === "color" || kind === "color-text") {
      value = toHex(el.value);
      if (kind === "color-text" && !/^#[0-9a-f]{6}$/i.test(el.value.trim())) return;
      // Keep the swatch and the hex box in step without a full re-render,
      // which would steal focus mid-typing.
      const pair = el.parentElement.querySelectorAll("[data-kind^='color']");
      pair.forEach((p) => { if (p !== el) p.value = value; });
    } else if (kind === "length" || kind === "duration") {
      value = `${toNumber(el.value)}${unit || "px"}`;
      el.parentElement.querySelectorAll("[data-kind='length']").forEach((p) => {
        if (p !== el) p.value = toNumber(el.value);
      });
    } else if (kind === "number") {
      value = Number(el.value);
      el.parentElement.querySelectorAll("[data-kind='number']").forEach((p) => {
        if (p !== el) p.value = el.value;
      });
    } else {
      value = el.value;
    }

    if (ruleId) {
      state.draft.rules[ruleId] = el.value;
      touched();
      // A rule can change both tokens and the data-rule-* attributes the
      // components style against, so the preview needs both refreshed.
      applyRuleAttrs();
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => refreshPreview().then(renderGroups), 180);
      return;
    }

    if (globalId) {
      // Globals are numbers/strings as the schema declares them, not CSS.
      const spec = state.schema.globals.find((g) => g.id === globalId);
      const raw = ["number", "hue", "alpha"].includes(spec.control) ? Number(el.value)
        : ["length"].includes(spec.control) ? Number(toNumber(el.value))
        : value;
      state.draft.globals[globalId] = raw;
      touched();
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => refreshPreview().then(renderGroups), 180);
    } else if (token) {
      setOverride(scope, token, value);
      const host = el.closest(".field");
      if (host && !host.querySelector(".field__custom")) {
        host.querySelector(".field__head").insertAdjacentHTML("beforeend",
          `<button class="field__custom" type="button" data-reset="${esc(token)}"
             title="This value is pinned and no longer follows the globals">custom · reset</button>`);
      }
    }
  };

  const reloadMockups = async () => {
    const { systems } = await api("GET", "/state");
    const fresh = systems.find((s) => s.id === systemId);
    if (fresh) { state.system.mockups = fresh.mockups; renderMockups(); }
  };

  const onClick = async (e) => {
    const action = e.target.closest("[data-action]");
    if (action) {
      const { action: name, id, system } = action.dataset;
      try {
        if (name === "screen-new") {
          const device = window.Studio.ask("Screen to add (phone, ipad-portrait, ipad-landscape, desktop, desktop-wide, headset)", "desktop");
          if (!device) return;
          await api("POST", `/systems/${system}/mockups/${id}/screens`, { device });
          toast(`Added ${device} screen`, "vp-badge--positive");
          await reloadMockups();
          return;
        }
        if (name === "mockup-version") {
          const created = await api("POST", `/systems/${system}/mockups/${id}/version`);
          toast(`${created.id} created from ${created.derivedFrom}`, "vp-badge--positive");
          await reloadMockups();
          return;
        }
        if (name === "mockup-delete") {
          if (!confirmDelete("mockup", `${id} in ${system}`)) return;
          await api("DELETE", `/systems/${system}/mockups/${id}`);
          toast(`Deleted ${id}`);
          await reloadMockups();
          return;
        }
      } catch (err) { fail(err); }
    }

    const reset = e.target.closest("[data-reset]");
    if (reset) {
      const group = state.schema.groups.find((g) => g.tokens.some((t) => t.id === reset.dataset.reset));
      clearOverride(scopeOf(group), reset.dataset.reset);
      return;
    }

    const act = e.target.closest("[data-act]");
    if (!act) return;

    if (act.dataset.act === "save") return save();
    if (act.dataset.act === "save-version") return save({ asNewVersion: true });

    if (act.dataset.act === "theme") {
      // Cycles only the themes this system HAS. A light-only system has one,
      // and offering to edit its dark palette would be offering to edit a
      // palette that is never emitted.
      if (state.themes.length < 2) return;
      const i = state.themes.indexOf(state.theme);
      state.theme = state.themes[(i + 1) % state.themes.length];
      syncThemeButton();
      document.documentElement.setAttribute("data-theme", state.theme);
      renderGroups();
      refreshPreview();
      return;
    }

    if (act.dataset.act === "mockup-new") {
      const title = window.Studio.ask("Title for the new mockup", "New mockup");
      if (!title) return;
      const devices = window.Studio.ask(
        "Screens, comma separated (phone, ipad-portrait, ipad-landscape, desktop, desktop-wide, headset)",
        "phone,ipad-portrait,ipad-landscape");
      if (!devices) return;
      const created = await api("POST", `/systems/${systemId}/mockups`, {
        title, devices: devices.split(",").map((d) => d.trim()).filter(Boolean),
      });
      toast(`Created ${created.id} with ${created.screens} screen(s)`, "vp-badge--positive");
      await reloadMockups();
      return;
    }

    if (act.dataset.act === "delete") {
      if (!confirmDelete(`system "${state.draft.name}"`, systemId)) return;
      await api("DELETE", `/systems/${systemId}`);
      location.href = "index.html";
    }
  };

  /* ---- Boot -------------------------------------------------------------- */

  const boot = async () => {
    if (!systemId) { location.href = "index.html"; return; }

    const { schema, systems } = await api("GET", "/state");
    const system = systems.find((s) => s.id === systemId);
    if (!system) {
      document.querySelector(".studio__main").innerHTML =
        `<p class="vp-empty">No system called <code>${esc(systemId)}</code>. <a href="index.html">Back to the studio</a>.</p>`;
      return;
    }

    state.schema = schema;
    state.system = system;
    state.resolved = system.resolved;
    state.draft = {
      name: system.name,
      note: system.note ?? "",
      globals: { ...system.globals },
      rules: { ...(system.resolved?.rules ?? {}) },
      overrides: structuredClone(system.overrides ?? {}),
    };

    state.themes = system.resolved?.themes ?? ["dark", "light"];
    state.theme = state.themes[0];
    document.documentElement.setAttribute("data-theme", state.theme);
    syncThemeButton();

    renderMockups();

    document.getElementById("elements-link").href =
      `/system/preview.html?system=${encodeURIComponent(systemId)}`;

    document.getElementById("name").addEventListener("input", (e) => {
      state.draft.name = e.target.value;
      touched();
    });

    document.getElementById("preview").src = previewSrc();
    document.getElementById("preview").addEventListener("load", refreshPreview);

    renderAll();

    document.addEventListener("input", onInput);
    document.addEventListener("click", onClick);

    window.addEventListener("beforeunload", (e) => {
      if (!state.dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });
  };

  boot().catch((err) => {
    document.querySelector(".studio__main").innerHTML =
      '<p class="vp-empty">Could not reach the studio server. Start it with <code>npm run studio</code>.</p>';
    console.error(err);
  });
})();
