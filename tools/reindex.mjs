#!/usr/bin/env node
/**
 * Rebuild systems/manifest.js from what is on disk, and regenerate every
 * system's tokens.css from its system.json.
 *
 *   node tools/reindex.mjs
 *
 * The manifest is a plain .js file rather than .json on purpose: a <script>
 * tag loads over file://, whereas fetch("manifest.json") is blocked by the
 * browser's file-origin rules. That keeps "double-click index.html" a working
 * workflow with no server and no build step.
 *
 * The studio writes the manifest itself on every change, so you only need to
 * run this by hand after editing files directly or pulling someone else's work.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSystems, writeTokens, resolve, loadSchema, SYSTEMS_DIR } from "./lib/system.mjs";

const HEADER = `/* ==========================================================================
   GENERATED FILE — run \`node tools/reindex.mjs\` to rebuild.

   A plain .js rather than .json so a <script> tag loads it over file://,
   where fetch() of a local JSON file is blocked.
   ========================================================================== */

`;

export const reindex = async ({ regenerateTokens = true } = {}) => {
  const systems = await listSystems();

  if (regenerateTokens) {
    for (const s of systems) await writeTokens(s.id, s);
  }

  // Newest version of each family first, then the rest — so the default is
  // the most recently worked-on system rather than an arbitrary one.
  const latest = systems.filter((s, i, all) =>
    !all.some((o) => o.family === s.family && o.version > s.version));

  const schema = await loadSchema();

  const payload = systems.map((s) => {
    // The tile shows a system's palette at a glance, so the manifest carries
    // the resolved swatches rather than making every viewer re-derive them.
    const tokens = resolve(s, schema).dark;
    return {
    id: s.id,
    family: s.family,
    version: s.version,
    name: s.name,
    note: s.note ?? "",
    updated: s.updated ?? "",
    isLatest: latest.some((l) => l.id === s.id),
    accent: tokens["--accent"],
    lineWeight: s.globals?.lineWeight ?? 1,
    surfaces: [tokens["--surface-0"], tokens["--surface-1"], tokens["--surface-2"], tokens["--surface-raised"]],
    mockups: s.mockups,
    };
  });

  const def = latest[0]?.id ?? systems[0]?.id ?? "";

  await writeFile(
    path.join(SYSTEMS_DIR, "manifest.js"),
    `${HEADER}window.VP_SYSTEMS = ${JSON.stringify(payload, null, 2)};\n\n` +
    `window.VP_SYSTEM_DEFAULT = ${JSON.stringify(def)};\n`,
    "utf8"
  );

  return payload;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  reindex()
    .then((s) => {
      const mockups = s.reduce((n, x) => n + x.mockups.length, 0);
      console.log(`Indexed ${s.length} system${s.length === 1 ? "" : "s"}, ${mockups} mockup${mockups === 1 ? "" : "s"}.`);
    })
    .catch((err) => { console.error(err); process.exit(1); });
}
