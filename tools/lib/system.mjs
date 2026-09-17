/* ==========================================================================
   Design systems as data.
   --------------------------------------------------------------------------
   A system is a folder under systems/ holding a system.json (globals plus any
   explicit token overrides) and a generated tokens.css. Mockups live inside
   the system they belong to.

   Everything a system needs is DERIVED from a handful of globals, so changing
   one global cascades through every token. An explicit override wins over the
   derived value and is remembered as an override, which is what lets the
   studio show "custom" next to it and offer a reset.

   Versions are explicit: nothing here ever overwrites a sibling version, and
   the only destructive operation is remove(), which the studio asks about
   first.
   ========================================================================== */

import { readFile, writeFile, mkdir, readdir, rm, cp, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./color.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SYSTEMS_DIR = path.join(ROOT, "systems");

const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

/** Every path the studio touches goes through here. An id from an HTTP request
 *  must never be able to escape systems/. */
export const assertId = (id, what = "id") => {
  if (typeof id !== "string" || !SAFE_ID.test(id) || id.includes("..")) {
    throw Object.assign(new Error(`Invalid ${what}: ${JSON.stringify(id)}`), { status: 400 });
  }
  return id;
};

export const slugify = (s) =>
  String(s).toLowerCase().normalize("NFKD")
    .replace(/[^\w\s-]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";

const exists = async (p) => { try { await access(p, constants.F_OK); return true; } catch { return false; } };

export const loadSchema = async () =>
  JSON.parse(await readFile(path.join(ROOT, "system", "schema.json"), "utf8"));

/* ---- Version naming ------------------------------------------------------
   `family-v3`. The family groups versions in the tile view; the number makes
   the order explicit and means a new version can never collide with one that
   already exists. */
export const splitVersion = (id) => {
  const m = /^(.*)-v(\d+)$/.exec(id);
  return m ? { family: m[1], version: Number(m[2]) } : { family: id, version: 1 };
};

const nextVersionId = (family, taken) => {
  let n = 1;
  for (const id of taken) {
    const parsed = splitVersion(id);
    if (parsed.family === family) n = Math.max(n, parsed.version + 1);
  }
  return `${family}-v${n}`;
};

/* ---- Derivation ---------------------------------------------------------- */

const DENSITY = {
  compact:     { min: 44, comfortable: 48, xr: 56 },
  comfortable: { min: 44, comfortable: 56, xr: 64 },
  field:       { min: 56, comfortable: 64, xr: 72 },
};

const TYPE_STEPS = { "--text-xs": -1.6, "--text-sm": -0.8, "--text-base": 0, "--text-lg": 1, "--text-xl": 2, "--text-2xl": 3, "--text-3xl": 4 };
const SPACE_STEPS = { "--space-1": 1, "--space-2": 2, "--space-3": 3, "--space-4": 4, "--space-5": 6, "--space-6": 8, "--space-7": 12, "--space-8": 16 };

const STATUS_BASE = { positive: "#1f9d63", caution: "#d98a10", critical: "#d9453f" };

export const defaultGlobals = (schema) =>
  Object.fromEntries(schema.globals.map((g) => [g.id, g.default]));

const fontStack = (schema, value) =>
  schema.fonts.find((f) => f.value === value)?.stack ?? value;

/** Scalars that do not change between themes. */
export const deriveShared = (g, schema) => {
  const px = (n) => `${Math.round(n)}px`;
  const out = {};

  const u = Number(g.spaceUnit);
  out["--space-0"] = "0";
  for (const [token, mult] of Object.entries(SPACE_STEPS)) out[token] = px(u * mult);

  const r = Number(g.radius);
  out["--radius-sm"] = px(Math.max(0, r / 2));
  out["--radius-md"] = px(r);
  out["--radius-lg"] = px(r * 1.75);
  out["--radius-xl"] = px(r * 2.75);
  out["--radius-pill"] = "999px";

  const base = Number(g.baseFontSize), ratio = Number(g.typeScale);
  for (const [token, step] of Object.entries(TYPE_STEPS)) {
    out[token] = px(Math.max(10, base * ratio ** step));
  }

  out["--font-sans"] = fontStack(schema, g.fontSans);
  out["--font-mono"] = fontStack(schema, g.fontMono);

  out["--leading-tight"] = "1.2";
  out["--leading-normal"] = "1.45";
  out["--leading-loose"] = "1.65";
  out["--weight-regular"] = "400";
  out["--weight-medium"] = "500";
  out["--weight-semibold"] = "600";
  out["--tracking-wide"] = "0.06em";

  const d = DENSITY[g.density] ?? DENSITY.comfortable;
  out["--hit-min"] = px(d.min);
  out["--hit-comfortable"] = px(d.comfortable);
  out["--hit-xr"] = px(d.xr);

  out["--duration-instant"] = "80ms";
  out["--duration-fast"] = "140ms";
  out["--duration-normal"] = "220ms";
  out["--duration-slow"] = "360ms";
  out["--ease-standard"] = "cubic-bezier(0.2, 0, 0, 1)";
  out["--ease-enter"] = "cubic-bezier(0, 0, 0, 1)";
  out["--ease-exit"] = "cubic-bezier(0.3, 0, 1, 1)";

  out["--depth-flush"] = "0mm";
  out["--depth-raised"] = "4mm";
  out["--depth-float"] = "12mm";
  out["--depth-modal"] = "30mm";

  out["--blur-panel"] = "18px";
  out["--blur-scrim"] = "6px";

  out["--panel-width-sm"] = "260px";
  out["--panel-width-md"] = "320px";
  out["--panel-width-lg"] = "400px";
  out["--toolbar-thickness"] = px(d.xr);
  out["--content-max"] = "1200px";

  out["--z-base"] = "0";
  out["--z-panel"] = "10";
  out["--z-toolbar"] = "20";
  out["--z-popover"] = "30";
  out["--z-modal"] = "40";
  out["--z-toast"] = "50";

  return out;
};

/** Colours and shadows, per theme. */
export const deriveTheme = (g, mode) => {
  const n = C.neutralRamp(Number(g.neutralHue), Number(g.neutralChroma));
  const a = C.accentRamp(g.accent);
  const white = { r: 255, g: 255, b: 255 };
  const out = {};
  const dark = mode === "dark";

  const surface = dark
    ? { 0: n[950], 1: n[900], 2: n[850], 3: n[800], raised: n[700], sunken: n[950] }
    : { 0: n["050"], 1: "#ffffff", 2: n["050"], 3: n[100], raised: "#ffffff", sunken: n[100] };

  out["--surface-0"] = surface[0];
  out["--surface-1"] = surface[1];
  out["--surface-2"] = surface[2];
  out["--surface-3"] = surface[3];
  out["--surface-raised"] = surface.raised;
  out["--surface-sunken"] = surface.sunken;

  const opacity = Number(g.panelOpacity);
  out["--surface-glass"] = C.rgbaString(surface[2], opacity.toFixed(2));
  out["--surface-glass-strong"] = C.rgbaString(surface[1], Math.min(1, opacity + 0.16).toFixed(2));
  out["--surface-scrim"] = C.rgbaString(surface[0], dark ? "0.60" : "0.32");

  const edge = dark ? "255 255 255" : "12 16 24";
  out["--border-subtle"] = `rgb(${edge} / ${dark ? 0.07 : 0.07})`;
  out["--border-default"] = `rgb(${edge} / ${dark ? 0.12 : 0.14})`;
  out["--border-strong"] = `rgb(${edge} / ${dark ? 0.22 : 0.28})`;

  out["--text-primary"] = dark ? n["050"] : n[900];
  out["--text-secondary"] = dark ? n[300] : n[600];
  out["--text-muted"] = dark ? n[400] : n[500];
  out["--text-disabled"] = n[400];
  out["--text-on-accent"] = "#ffffff";

  out["--accent"] = dark ? a[500] : a[600];
  out["--accent-hover"] = dark ? a[400] : a[500];
  out["--accent-press"] = dark ? a[600] : a[700];
  out["--accent-quiet"] = C.rgbaString(g.accent, dark ? "0.16" : "0.12");

  /* Three fills that all clear AA against white, in a hover/press progression:
     hover is the lightest passing value, solid a step darker, press darker
     still. Derived rather than picked, so any accent stays legible. */
  out["--accent-solid"] = C.solidFor(g.accent, white, 5.0);
  out["--accent-solid-hover"] = C.solidFor(g.accent, white, 4.5);
  out["--accent-solid-press"] = C.solidFor(g.accent, white, 6.5);
  /* A tinted chip can sit on any surface in the system, and the hardest case
     is the lightest one in dark mode / the darkest in light mode. Deriving
     against that means the value holds wherever the badge is actually used,
     rather than only on the one surface we happened to pick. */
  const candidates = [surface[1], surface[2], surface[3], surface.raised].map(C.hexToRgb);
  const hardest = candidates.reduce((worst, c) =>
    (dark ? C.relLuminance(c) > C.relLuminance(worst) : C.relLuminance(c) < C.relLuminance(worst)) ? c : worst);

  const chipOver = (hex, alpha) => ({
    r: C.hexToRgb(hex).r * alpha + hardest.r * (1 - alpha),
    g: C.hexToRgb(hex).g * alpha + hardest.g * (1 - alpha),
    b: C.hexToRgb(hex).b * alpha + hardest.b * (1 - alpha),
  });

  // A hair above 4.5 so rounding in the browser cannot tip it under.
  out["--accent-fg"] = C.fgFor(g.accent, chipOver(g.accent, dark ? 0.16 : 0.12), 4.6);

  out["--border-focus"] = dark ? a[400] : a[500];

  for (const [name, hex] of Object.entries(STATUS_BASE)) {
    out[`--status-${name}`] = hex;
    // Status TEXT sits on a 20%-tint chip, judged against the same hardest
    // surface as the accent chip above.
    out[`--status-${name}-fg`] = C.fgFor(hex, chipOver(hex, 0.20), 4.6);
  }
  out["--status-critical-solid"] = C.solidFor(STATUS_BASE.critical, white, 4.5);

  const sh = dark ? "0 0 0" : "12 16 24";
  const alpha = dark ? [0.30, 0.36, 0.44, 0.52] : [0.08, 0.10, 0.14, 0.18];
  out["--shadow-1"] = `0 1px 2px rgb(${sh} / ${alpha[0]})`;
  out["--shadow-2"] = `0 4px 12px rgb(${sh} / ${alpha[1]})`;
  out["--shadow-3"] = `0 12px 32px rgb(${sh} / ${alpha[2]})`;
  out["--shadow-4"] = `0 24px 64px rgb(${sh} / ${alpha[3]})`;

  return out;
};

/** The full resolved token set, overrides applied. */
export const resolve = (system, schema) => {
  const g = { ...defaultGlobals(schema), ...(system.globals ?? {}) };
  const o = system.overrides ?? {};
  return {
    globals: g,
    shared: { ...deriveShared(g, schema), ...(o.shared ?? {}) },
    dark: { ...deriveTheme(g, "dark"), ...(o.dark ?? {}) },
    light: { ...deriveTheme(g, "light"), ...(o.light ?? {}) },
  };
};

const block = (tokens) =>
  Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join("\n");

export const toCss = (system, schema) => {
  const r = resolve(system, schema);
  const overrides = system.overrides ?? {};
  const customCount = ["shared", "dark", "light"].reduce((n, k) => n + Object.keys(overrides[k] ?? {}).length, 0);

  return `/* ==========================================================================
   ${system.name} — design tokens
   --------------------------------------------------------------------------
   GENERATED FILE. Edit the system in the studio (\`npm run studio\`) or edit
   systems/${system.id}/system.json; do not edit this file, it is rewritten.

   Derived from ${Object.keys(r.globals).length} globals${customCount ? `, with ${customCount} explicit override${customCount === 1 ? "" : "s"}` : ""}.
   Generated ${new Date().toISOString().slice(0, 10)}.
   ========================================================================== */

:root {
${block(r.shared)}

${block(r.dark)}
}

[data-theme="light"] {
${block(r.light)}
}
`;
};

/* ---- Reading ------------------------------------------------------------- */

export const listSystems = async () => {
  if (!(await exists(SYSTEMS_DIR))) return [];
  const entries = await readdir(SYSTEMS_DIR, { withFileTypes: true });
  const systems = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith("_") || e.name.startsWith(".")) continue;
    try {
      systems.push(await readSystem(e.name));
    } catch { /* a folder that is not a system is not an error */ }
  }
  return systems.sort((a, b) =>
    a.family === b.family ? b.version - a.version : a.family.localeCompare(b.family));
};

export const readSystem = async (id) => {
  assertId(id, "system id");
  const file = path.join(SYSTEMS_DIR, id, "system.json");
  const data = JSON.parse(await readFile(file, "utf8"));
  const { family, version } = splitVersion(id);
  return { ...data, id, family, version, mockups: await listMockups(id) };
};

export const listMockups = async (systemId) => {
  assertId(systemId, "system id");
  const dir = path.join(SYSTEMS_DIR, systemId, "mockups");
  if (!(await exists(dir))) return [];
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const metaFile = path.join(dir, e.name, "mockup.json");
    const { family, version } = splitVersion(e.name);
    let meta = {};
    try { meta = JSON.parse(await readFile(metaFile, "utf8")); } catch { /* derive below */ }
    if (!(await exists(path.join(dir, e.name, "index.html")))) continue;
    out.push({
      id: e.name,
      family,
      version,
      title: meta.title || e.name,
      device: meta.device || "ipad-landscape",
      status: meta.status || "draft",
      summary: meta.summary || "",
      updated: meta.updated || "",
      href: `systems/${systemId}/mockups/${e.name}/index.html`,
    });
  }
  return out.sort((a, b) => (a.family === b.family ? b.version - a.version : a.family.localeCompare(b.family)));
};

/* ---- Writing ------------------------------------------------------------- */

export const saveSystem = async (id, patch) => {
  assertId(id, "system id");
  const dir = path.join(SYSTEMS_DIR, id);
  const file = path.join(dir, "system.json");
  const current = JSON.parse(await readFile(file, "utf8"));

  const next = {
    ...current,
    ...patch,
    id,
    globals: { ...(current.globals ?? {}), ...(patch.globals ?? {}) },
    overrides: patch.overrides ? patch.overrides : current.overrides ?? {},
    updated: new Date().toISOString().slice(0, 10),
  };

  await writeFile(file, JSON.stringify(next, null, 2) + "\n", "utf8");
  await writeTokens(id, next);
  return readSystem(id);
};

export const writeTokens = async (id, system) => {
  const schema = await loadSchema();
  await writeFile(path.join(SYSTEMS_DIR, id, "tokens.css"), toCss({ ...system, id }, schema), "utf8");
};

export const createSystem = async ({ name, from }) => {
  const schema = await loadSchema();
  const family = slugify(name || "system");
  const taken = (await listSystems()).map((s) => s.id);
  const id = nextVersionId(family, taken);
  const dir = path.join(SYSTEMS_DIR, id);

  if (await exists(dir)) throw Object.assign(new Error("System already exists"), { status: 409 });

  let seed = { name: name || "New system", globals: defaultGlobals(schema), overrides: {} };
  if (from) {
    assertId(from, "source system id");
    const source = await readSystem(from);
    seed = { name: name || source.name, globals: { ...source.globals }, overrides: structuredClone(source.overrides ?? {}) };
  }

  const system = {
    id,
    name: seed.name,
    note: "",
    created: new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
    globals: seed.globals,
    overrides: seed.overrides,
  };

  await mkdir(path.join(dir, "mockups"), { recursive: true });
  await writeFile(path.join(dir, "system.json"), JSON.stringify(system, null, 2) + "\n", "utf8");
  await writeTokens(id, system);
  return readSystem(id);
};

/** A new version of an existing system: same family, next number, mockups and
 *  all. The source is left exactly as it was. */
export const versionSystem = async (id) => {
  assertId(id, "system id");
  const source = await readSystem(id);
  const taken = (await listSystems()).map((s) => s.id);
  const newId = nextVersionId(source.family, taken);

  await cp(path.join(SYSTEMS_DIR, id), path.join(SYSTEMS_DIR, newId), { recursive: true });

  const system = {
    ...JSON.parse(await readFile(path.join(SYSTEMS_DIR, newId, "system.json"), "utf8")),
    id: newId,
    updated: new Date().toISOString().slice(0, 10),
    derivedFrom: id,
  };
  await writeFile(path.join(SYSTEMS_DIR, newId, "system.json"), JSON.stringify(system, null, 2) + "\n", "utf8");
  await writeTokens(newId, system);
  return readSystem(newId);
};

export const removeSystem = async (id) => {
  assertId(id, "system id");
  const dir = path.join(SYSTEMS_DIR, id);
  if (!(await exists(dir))) throw Object.assign(new Error("No such system"), { status: 404 });
  await rm(dir, { recursive: true, force: true });
  return { removed: id };
};

export const removeMockup = async (systemId, mockupId) => {
  assertId(systemId, "system id");
  assertId(mockupId, "mockup id");
  const dir = path.join(SYSTEMS_DIR, systemId, "mockups", mockupId);
  if (!(await exists(dir))) throw Object.assign(new Error("No such mockup"), { status: 404 });
  await rm(dir, { recursive: true, force: true });
  return { removed: mockupId };
};
