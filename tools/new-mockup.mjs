#!/usr/bin/env node
/**
 * Scaffold a new mockup inside a system.
 *
 *   node tools/new-mockup.mjs "Measurement review" \
 *        --system viewport-xr-v1 --devices phone,ipad-portrait,ipad-landscape
 *
 * A mockup is ONE idea shown across screen types, so it gets a folder holding
 * a screen file per device plus a mockup.json listing them. --devices defaults
 * to the three that matter: phone, iPad portrait, iPad landscape.
 *
 * If --system is omitted it uses the newest version of the only system, or
 * lists them and stops if there is more than one.
 *
 * The studio does the same thing from its UI; this is here for when you are
 * already in a terminal, and for Claude.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSystems, listMockups, slugify, splitVersion, DEVICE_ORDER, DEVICE_LABEL, SYSTEMS_DIR, ROOT } from "./lib/system.mjs";
import { reindex } from "./reindex.mjs";

const DEVICES = {
  "ipad-landscape": ["device--ipad-landscape", "iPad Pro · landscape · 1366×1024"],
  "ipad-portrait": ["device--ipad-portrait", "iPad Pro · portrait · 1024×1366"],
  desktop: ["device--desktop", "Desktop · 1440×900"],
  "desktop-wide": ["device--desktop-wide", "Desktop · 1920×1080"],
  headset: ["device--headset", "Headset · comfortable FOV · 1280×800"],
  phone: ["device--phone", "Phone · 393×852"],
};

const flag = (argv, name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
};

const main = async () => {
  const argv = process.argv.slice(2);
  const deviceList = (flag(argv, "devices") ?? flag(argv, "device") ?? "phone,ipad-portrait,ipad-landscape")
    .split(",").map((d) => d.trim()).filter(Boolean);
  const systemFlag = flag(argv, "system");

  // Strip flags and their values, leaving the title.
  const title = argv
    .filter((a, i) => {
      if (a.startsWith("--")) return false;
      const prev = argv[i - 1];
      return !(prev === "--device" || prev === "--devices" || prev === "--system");
    })
    .join(" ")
    .trim();

  if (!title) {
    console.error('Usage: node tools/new-mockup.mjs "Title" [--system <id>] [--devices a,b,c]');
    console.error(`Devices: ${Object.keys(DEVICES).join(", ")}`);
    process.exit(1);
  }

  const unknown = deviceList.filter((d) => !DEVICES[d]);
  if (unknown.length) {
    console.error(`Unknown device(s): ${unknown.join(", ")}. Known: ${Object.keys(DEVICES).join(", ")}`);
    process.exit(1);
  }
  deviceList.sort((a, b) => DEVICE_ORDER.indexOf(a) - DEVICE_ORDER.indexOf(b));

  const systems = await listSystems();
  if (systems.length === 0) {
    console.error("No systems yet. Run `npm run studio` and create one first.");
    process.exit(1);
  }

  let systemId = systemFlag;
  if (!systemId) {
    const families = new Set(systems.map((s) => s.family));
    if (families.size > 1) {
      console.error("More than one system — say which with --system:\n");
      for (const s of systems) console.error(`  ${s.id.padEnd(28)} ${s.name}`);
      process.exit(1);
    }
    systemId = systems.reduce((a, b) => (b.version > a.version ? b : a)).id;
  }

  if (!systems.some((s) => s.id === systemId)) {
    console.error(`No system called "${systemId}". Known: ${systems.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }

  // Versioned ids, same rule as systems: never collide, never overwrite.
  const family = slugify(title);
  const existing = (await listMockups(systemId)).map((m) => m.id);
  let n = 1;
  for (const id of existing) {
    const p = splitVersion(id);
    if (p.family === family) n = Math.max(n, p.version + 1);
  }
  const id = `${family}-v${n}`;
  const dir = path.join(SYSTEMS_DIR, systemId, "mockups", id);

  if (existsSync(dir)) {
    console.error(`${dir} already exists.`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const template = await readFile(path.join(ROOT, "templates", "mockup.html"), "utf8");

  await mkdir(dir, { recursive: true });

  const screens = [];
  for (const d of deviceList) {
    const frame = DEVICES[d];
    const screenTitle = DEVICE_LABEL[d] ?? d;
    const html = template
      .replaceAll("TITLE", `${title} — ${screenTitle}`)
      .replace("DEVICE", frame[1])
      .replace("YYYY-MM-DD", today)
      .replace('class="device device--ipad-landscape"', `class="device ${frame[0]}"`)
      .replace('data-device="iPad Pro · landscape · 1366×1024"', `data-device="${frame[1]}"`);
    await writeFile(path.join(dir, `${d}.html`), html, "utf8");
    screens.push({ device: d, file: `${d}.html`, title: screenTitle });
  }

  await writeFile(path.join(dir, "mockup.json"), JSON.stringify({
    title, status: "draft", summary: "", created: today, updated: today, screens,
  }, null, 2) + "\n", "utf8");

  await reindex({ regenerateTokens: false });
  console.log(`Created systems/${systemId}/mockups/${id}/ with ${screens.length} screen(s):`);
  for (const sc of screens) console.log(`  ${sc.file}  ${sc.title}`);
};

main().catch((err) => { console.error(err); process.exit(1); });
