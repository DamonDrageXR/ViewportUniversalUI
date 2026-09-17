#!/usr/bin/env node
/**
 * Scaffold a new mockup from templates/mockup.html.
 *
 *   node tools/new-mockup.mjs "Desktop review — measurement panel" [--device desktop]
 *
 * Creates mockups/<nnn>-<slug>/index.html with the title, date and device frame
 * filled in, then refreshes the gallery manifest.
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reindex } from "./reindex.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEVICES = {
  "ipad-landscape": ["device--ipad-landscape", "iPad Pro · landscape · 1366×1024"],
  "ipad-portrait": ["device--ipad-portrait", "iPad Pro · portrait · 1024×1366"],
  desktop: ["device--desktop", "Desktop · 1440×900"],
  "desktop-wide": ["device--desktop-wide", "Desktop · 1920×1080"],
  headset: ["device--headset", "Headset · comfortable FOV · 1280×800"],
  phone: ["device--phone", "Phone · 393×852"]
};

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const nextNumber = async () => {
  const dir = path.join(ROOT, "mockups");
  if (!existsSync(dir)) return 1;
  const entries = await readdir(dir, { withFileTypes: true });
  const used = entries
    .filter((e) => e.isDirectory())
    .map((e) => Number.parseInt(e.name.slice(0, 3), 10))
    .filter((n) => Number.isFinite(n));
  return used.length ? Math.max(...used) + 1 : 1;
};

const main = async () => {
  const argv = process.argv.slice(2);
  const deviceFlag = argv.indexOf("--device");
  const deviceKey = deviceFlag === -1 ? "ipad-landscape" : argv[deviceFlag + 1];
  const title = argv.filter((a, i) => i !== deviceFlag && i !== deviceFlag + 1).join(" ").trim();

  if (!title) {
    console.error('Usage: node tools/new-mockup.mjs "Title of the mockup" [--device ipad-landscape]');
    console.error(`Devices: ${Object.keys(DEVICES).join(", ")}`);
    process.exit(1);
  }

  const device = DEVICES[deviceKey];
  if (!device) {
    console.error(`Unknown device "${deviceKey}". Known: ${Object.keys(DEVICES).join(", ")}`);
    process.exit(1);
  }

  const slug = `${String(await nextNumber()).padStart(3, "0")}-${slugify(title)}`;
  const dir = path.join(ROOT, "mockups", slug);

  if (existsSync(dir)) {
    console.error(`${dir} already exists — pick a different title.`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const template = await readFile(path.join(ROOT, "templates", "mockup.html"), "utf8");

  const html = template
    .replaceAll("TITLE", title)
    .replace("DEVICE", device[1])
    .replace("YYYY-MM-DD", today)
    .replace('class="device device--ipad-landscape"', `class="device ${device[0]}"`)
    .replace('data-device="iPad Pro · landscape · 1366×1024"', `data-device="${device[1]}"`);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html, "utf8");

  await reindex();

  console.log(`Created mockups/${slug}/index.html`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
