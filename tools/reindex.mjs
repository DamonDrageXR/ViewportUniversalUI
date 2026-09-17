#!/usr/bin/env node
/**
 * Rebuild gallery/manifest.js from the mockups on disk.
 *
 *   node tools/reindex.mjs
 *
 * Each mockup's metadata is read out of its own HTML — the <title> and the
 * `.stage__meta` line — so the file stays the single source of truth and the
 * manifest can always be thrown away and regenerated. Hand-written `summary`
 * text in the existing manifest is preserved, because it is the one field the
 * HTML does not carry.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "gallery", "manifest.js");

const HEADER = `/* ==========================================================================
   Mockup manifest — the index the gallery reads.
   --------------------------------------------------------------------------
   A plain .js file rather than .json on purpose: a <script> tag loads over
   file://, whereas fetch("manifest.json") is blocked by the browser's
   file-origin rules. That keeps "double-click index.html" a working workflow
   with no server and no build step.

   Regenerate with \`node tools/reindex.mjs\`, or just edit it by hand — it is
   only ever read by the gallery.
   ========================================================================== */

window.VP_MOCKUPS = `;

/** Pull the hand-written summaries out of the current manifest so a reindex
 *  does not silently discard them. */
const existingSummaries = async () => {
  const summaries = new Map();
  if (!existsSync(MANIFEST)) return summaries;
  const source = await readFile(MANIFEST, "utf8");
  const sandbox = { window: {} };
  try {
    // The manifest is a file we generate ourselves; evaluating it is how we
    // read it back without pulling in a JSON5 parser.
    new Function("window", source)(sandbox.window);
  } catch {
    return summaries;
  }
  for (const entry of sandbox.window.VP_MOCKUPS ?? []) {
    if (entry?.slug && entry.summary) summaries.set(entry.slug, entry.summary);
  }
  return summaries;
};

const field = (meta, label) => {
  const match = meta.match(new RegExp(`${label}:\\s*([^·]+)`, "i"));
  return match ? match[1].trim() : "";
};

export const reindex = async () => {
  const dir = path.join(ROOT, "mockups");
  if (!existsSync(dir)) return [];

  const summaries = await existingSummaries();
  const entries = (await readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const mockups = [];

  for (const slug of entries) {
    const file = path.join(dir, slug, "index.html");
    if (!existsSync(file)) continue;
    const html = await readFile(file, "utf8");

    const title =
      html.match(/<title>([^<]*?)(?:\s*—\s*Viewport Universal UI)?<\/title>/i)?.[1]?.trim() || slug;
    const meta = html.match(/class="stage__meta"[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
    const updated = meta.match(/Updated\s+(\d{4}-\d{2}-\d{2})/i)?.[1] || "";

    mockups.push({
      slug,
      title,
      target: field(meta, "Target"),
      status: field(meta, "Status") || "draft",
      updated,
      summary: summaries.get(slug) || ""
    });
  }

  await writeFile(MANIFEST, `${HEADER}${JSON.stringify(mockups, null, 2)};\n`, "utf8");
  return mockups;
};

// Only run when invoked directly, not when imported by new-mockup.mjs.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  reindex()
    .then((m) => console.log(`Indexed ${m.length} mockup${m.length === 1 ? "" : "s"}.`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
