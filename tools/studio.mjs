#!/usr/bin/env node
/**
 * The studio server.
 *
 *   npm run studio          # http://localhost:4173/studio/
 *
 * Serves the repo and exposes a small JSON API so the studio UI can create,
 * edit, version and delete systems and mockups as real files on disk. That is
 * the whole point of running a server rather than keeping state in the
 * browser: everything you do here lands in git, diffs like anything else, and
 * is still there in the next session.
 *
 * It binds to loopback only and refuses any path outside the repo. It is a
 * local design tool, not something to expose.
 */

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, cp, readdir } from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "./lib/system.mjs";
import { reindex } from "./reindex.mjs";

const ROOT = S.ROOT;
const PORT = Number(process.env.PORT || 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".md": "text/plain; charset=utf-8",
};

const json = (res, status, body) => {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(text) });
  res.end(text);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      // A design system is a few KB. Anything larger is a mistake or an abuse.
      if (raw.length > 2_000_000) { reject(Object.assign(new Error("Body too large"), { status: 413 })); req.destroy(); }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); }
    });
    req.on("error", reject);
  });

/* ---- Mockup creation -----------------------------------------------------
   Mirrors tools/new-mockup.mjs, but writing into a system. */
const DEVICES = {
  "ipad-landscape": ["device--ipad-landscape", "iPad Pro · landscape · 1366×1024"],
  "ipad-portrait": ["device--ipad-portrait", "iPad Pro · portrait · 1024×1366"],
  desktop: ["device--desktop", "Desktop · 1440×900"],
  "desktop-wide": ["device--desktop-wide", "Desktop · 1920×1080"],
  headset: ["device--headset", "Headset · comfortable FOV · 1280×800"],
  phone: ["device--phone", "Phone · 393×852"],
};

const nextId = (family, taken) => {
  let n = 1;
  for (const id of taken) {
    const p = S.splitVersion(id);
    if (p.family === family) n = Math.max(n, p.version + 1);
  }
  return `${family}-v${n}`;
};

const createMockup = async (systemId, { title, device = "ipad-landscape" }) => {
  S.assertId(systemId, "system id");
  const frame = DEVICES[device];
  if (!frame) throw Object.assign(new Error(`Unknown device: ${device}`), { status: 400 });

  const existing = (await S.listMockups(systemId)).map((m) => m.id);
  const id = nextId(S.slugify(title || "mockup"), existing);
  const dir = path.join(S.SYSTEMS_DIR, systemId, "mockups", id);
  const today = new Date().toISOString().slice(0, 10);

  const template = await readFile(path.join(ROOT, "templates", "mockup.html"), "utf8");
  const html = template
    .replaceAll("TITLE", title || "Untitled")
    .replace("DEVICE", frame[1])
    .replace("YYYY-MM-DD", today)
    .replace('class="device device--ipad-landscape"', `class="device ${frame[0]}"`)
    .replace('data-device="iPad Pro · landscape · 1366×1024"', `data-device="${frame[1]}"`);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html, "utf8");
  await writeFile(path.join(dir, "mockup.json"), JSON.stringify({
    title: title || "Untitled", device, status: "draft", summary: "", created: today, updated: today,
  }, null, 2) + "\n", "utf8");

  return { id, systemId };
};

/** A new version of a mockup: same family, next number, source untouched. */
const versionMockup = async (systemId, mockupId) => {
  S.assertId(systemId, "system id");
  S.assertId(mockupId, "mockup id");
  const dir = path.join(S.SYSTEMS_DIR, systemId, "mockups");
  const existing = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  const { family } = S.splitVersion(mockupId);
  const id = nextId(family, existing);

  await cp(path.join(dir, mockupId), path.join(dir, id), { recursive: true });

  const metaFile = path.join(dir, id, "mockup.json");
  const meta = JSON.parse(await readFile(metaFile, "utf8"));
  meta.updated = new Date().toISOString().slice(0, 10);
  meta.derivedFrom = mockupId;
  meta.status = "draft";
  await writeFile(metaFile, JSON.stringify(meta, null, 2) + "\n", "utf8");

  return { id, systemId, derivedFrom: mockupId };
};

/* ---- API ----------------------------------------------------------------- */
const api = async (req, res, url) => {
  const seg = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const body = req.method === "GET" ? {} : await readBody(req);

  // GET /api/state — everything the studio needs in one call.
  if (req.method === "GET" && seg[0] === "state") {
    const [schema, systems] = await Promise.all([S.loadSchema(), S.listSystems()]);
    const resolved = systems.map((s) => ({ ...s, resolved: S.resolve(s, schema) }));
    return json(res, 200, { schema, systems: resolved });
  }

  /* POST /api/preview {globals, overrides} — derive without writing.
     The editor needs live feedback as a slider moves, and deriving in the
     browser would mean a second copy of the derivation rules that could drift
     from this one. So it asks the server, and there stays exactly one
     implementation of what a global cascades into. */
  if (req.method === "POST" && seg[0] === "preview") {
    const schema = await S.loadSchema();
    const draft = { id: "preview", name: "Preview", globals: body.globals ?? {}, overrides: body.overrides ?? {} };
    return json(res, 200, { resolved: S.resolve(draft, schema), css: S.toCss(draft, schema) });
  }

  if (seg[0] !== "systems") throw Object.assign(new Error("Not found"), { status: 404 });

  const [, id, sub, subId] = seg;

  // POST /api/systems  {name, from}
  if (req.method === "POST" && !id) {
    const created = await S.createSystem(body);
    await reindex();
    return json(res, 201, created);
  }

  if (!id) throw Object.assign(new Error("Not found"), { status: 404 });

  // PUT /api/systems/:id  {name?, note?, globals?, overrides?}
  if (req.method === "PUT" && !sub) {
    const saved = await S.saveSystem(id, body);
    await reindex({ regenerateTokens: false });
    return json(res, 200, saved);
  }

  // DELETE /api/systems/:id
  if (req.method === "DELETE" && !sub) {
    const out = await S.removeSystem(id);
    await reindex();
    return json(res, 200, out);
  }

  // POST /api/systems/:id/version
  if (req.method === "POST" && sub === "version") {
    const out = await S.versionSystem(id);
    await reindex();
    return json(res, 201, out);
  }

  if (sub === "mockups") {
    // POST /api/systems/:id/mockups  {title, device}
    if (req.method === "POST" && !subId) {
      const out = await createMockup(id, body);
      await reindex({ regenerateTokens: false });
      return json(res, 201, out);
    }
    // POST /api/systems/:id/mockups/:mockupId/version
    if (req.method === "POST" && seg[4] === "version") {
      const out = await versionMockup(id, subId);
      await reindex({ regenerateTokens: false });
      return json(res, 201, out);
    }
    // DELETE /api/systems/:id/mockups/:mockupId
    if (req.method === "DELETE" && subId) {
      const out = await S.removeMockup(id, subId);
      await reindex({ regenerateTokens: false });
      return json(res, 200, out);
    }
  }

  throw Object.assign(new Error("Not found"), { status: 404 });
};

/* ---- Static -------------------------------------------------------------- */
const serveStatic = (res, pathname) => {
  const decoded = decodeURIComponent(pathname);
  let target = path.join(ROOT, decoded);

  // The only thing standing between a URL and the filesystem.
  const rel = path.relative(ROOT, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, "index.html");
  if (!existsSync(target)) { res.writeHead(404).end("Not found"); return; }

  res.writeHead(200, {
    "content-type": TYPES[path.extname(target)] ?? "application/octet-stream",
    // The studio rewrites files as you work; a cached tokens.css would show
    // you the previous version of your own edit.
    "cache-control": "no-store",
  });
  createReadStream(target).pipe(res);
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (url.pathname === "/") { res.writeHead(302, { location: "/studio/" }); return res.end(); }
    return serveStatic(res, url.pathname);
  } catch (err) {
    const status = err.status ?? 500;
    if (status >= 500) console.error(err);
    json(res, status, { error: err.message ?? "Server error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  Viewport UI studio\n  http://localhost:${PORT}/studio/\n\n  Editing files in ${ROOT}\n  Ctrl-C to stop.\n`);
});
