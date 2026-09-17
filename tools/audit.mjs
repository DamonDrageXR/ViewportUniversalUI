#!/usr/bin/env node
/**
 * Accessibility audit for every page in the repo.
 *
 *   node tools/audit.mjs            # audit everything
 *   node tools/audit.mjs 001        # audit mockups matching a substring
 *
 * Checks two things that XR UI gets wrong constantly and that are invisible
 * when you are eyeballing a mockup on a bright desk monitor:
 *
 *   1. Text contrast, in BOTH themes, with translucent fills composited down
 *      the ancestor stack. A `--surface-glass` panel is not its own colour.
 *   2. Interactive hit targets against --hit-min. A 32px icon button is fine
 *      with a mouse and unusable through a hand-tracked ray.
 *
 * Exits non-zero on failure so it can gate a commit or CI.
 * Requires Playwright (`npm i -D playwright` or a global install).
 *
 * KNOWN LIMITATION: contrast is composited over background *colours* only. A
 * `.device__scene` gradient, or a real site photo dropped in behind the UI,
 * is not sampled — the walk falls through it to the colour beneath. So a pass
 * here means "the panel chrome is sound", not "this is legible over any
 * scene". For anything floating directly over the scene with no backing of its
 * own, still check it by eye against a bright scene and a dark one. That is
 * exactly why convention 3 requires the backing in the first place.
 */

import { readdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Playwright may be installed locally or globally; resolve either. */
const loadPlaywright = async () => {
  const require_ = createRequire(import.meta.url);
  const candidates = [
    "playwright",
    "/opt/node22/lib/node_modules/playwright/index.mjs",
    "/usr/lib/node_modules/playwright/index.mjs",
  ];
  for (const id of candidates) {
    try {
      return id.startsWith("/") ? await import(pathToFileURL(id).href) : await import(require_.resolve(id));
    } catch { /* try the next candidate */ }
  }
  console.error("Playwright not found. Install it with:  npm install -D playwright");
  process.exit(2);
};

/* ---- Colour maths -------------------------------------------------------- */
const parseColor = (s) => {
  const n = (s.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  return { r: n[0] ?? 0, g: n[1] ?? 0, b: n[2] ?? 0, a: n.length > 3 ? n[3] : 1 };
};

const composite = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});

const luminance = (c) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* ---- Page probes ---------------------------------------------------------
   These run inside the browser, so they must be self-contained. */
const TEXT_SELECTOR = [
  ".vp-badge", ".vp-btn", ".vp-readout__value", ".vp-readout__label",
  ".vp-field__label", ".vp-field__hint", ".vp-tree__row", ".vp-tabs__tab",
  ".vp-segmented__option", ".vp-toggle", ".vp-panel__title", ".vp-input",
  "p", "h1", "h2", "h3", "li",
].join(", ");

const INTERACTIVE_SELECTOR = [
  "button", "a[href]", "input", "select", "textarea",
  '[role="button"]', '[role="option"]', ".vp-tree__row",
].join(", ");

const collect = (textSel, interactiveSel) => {
  const backgroundStack = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) stack.push(getComputedStyle(n).backgroundColor);
    stack.push("rgb(255, 255, 255)");
    return stack;
  };

  const inStage = (el) => el.closest(".stage__notes, .stage__header, .stage__bar, .doc__head, .sect > h2");

  const text = [...document.querySelectorAll(textSel)]
    .filter((el) => el.offsetParent !== null && !inStage(el))
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .map((el) => {
      const cs = getComputedStyle(el);
      return {
        label: el.className && typeof el.className === "string"
          ? el.className.split(" ").filter((c) => c.startsWith("vp-")).join(".") || el.tagName.toLowerCase()
          : el.tagName.toLowerCase(),
        sample: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28),
        fg: cs.color,
        stack: backgroundStack(el),
        size: parseFloat(cs.fontSize),
        weight: Number(cs.fontWeight),
        disabled: el.matches(":disabled") || el.getAttribute("aria-disabled") === "true",
      };
    });

  const hitMin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hit-min")) || 44;

  const targets = [...document.querySelectorAll(interactiveSel)]
    .filter((el) => el.offsetParent !== null && !inStage(el) && !el.matches(":disabled"))
    .filter((el) => {
      const cs = getComputedStyle(el);

      // Skip controls the user cannot hit directly: a visually hidden <input>
      // wrapped by a label is targeted through the label, which is measured too.
      if (cs.visibility === "hidden" || cs.pointerEvents === "none") return false;
      if (Number(cs.opacity) === 0) return false;

      // WCAG 2.5.8 exempts inline targets — "the target is in a sentence or its
      // size is otherwise constrained by the line-height of non-target text".
      // A link inside running prose cannot be 44px tall without wrecking the
      // paragraph, and is not what the rule is protecting. Detected as: renders
      // inline, and its parent carries text beyond the link itself.
      if (cs.display === "inline" && el.parentElement) {
        const own = (el.textContent || "").trim();
        const surrounding = (el.parentElement.textContent || "").trim();
        if (surrounding.length > own.length) return false;
      }

      return true;
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: (typeof el.className === "string" ? el.className.split(" ")[0] : "") || el.tagName.toLowerCase(),
        sample: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    })
    .filter((t) => t.w > 0 && t.h > 0);

  return { text, targets, hitMin };
};

/* ---- Runner -------------------------------------------------------------- */
const pagesToAudit = async (filter) => {
  // Every page a reviewer can reach, not just the mockups — the overview and
  // the docs page carry real interactive UI too.
  const pages = [
    { name: "index.html", url: path.join(ROOT, "index.html") },
    { name: "docs/how-to-use.html", url: path.join(ROOT, "docs", "how-to-use.html") },
  ];

  // A mockup renders with its own system's tokens, and the style guide has to
  // be checked once per system — a palette that passes in one can fail in
  // another, which is the whole reason the audit exists.
  const systems = path.join(ROOT, "systems");
  try {
    await access(systems, constants.R_OK);
    for (const sys of await readdir(systems, { withFileTypes: true })) {
      if (!sys.isDirectory() || sys.name.startsWith("_") || sys.name.startsWith(".")) continue;

      pages.push({
        name: `system preview · ${sys.name}`,
        url: path.join(ROOT, "system", "preview.html"),
        query: `?system=${sys.name}`,
      });

      const mockups = path.join(systems, sys.name, "mockups");
      try {
        for (const m of await readdir(mockups, { withFileTypes: true })) {
          if (!m.isDirectory()) continue;
          const file = path.join(mockups, m.name, "index.html");
          try { await access(file, constants.R_OK); } catch { continue; }
          pages.push({ name: `${sys.name}/${m.name}`, url: file });
        }
      } catch { /* a system with no mockups yet */ }
    }
  } catch { /* no systems yet */ }

  return filter ? pages.filter((p) => p.name.includes(filter)) : pages;
};

const main = async () => {
  const { chromium } = await loadPlaywright();
  const filter = process.argv[2];
  const pages = await pagesToAudit(filter);

  if (pages.length === 0) {
    console.log(filter ? `No pages match "${filter}".` : "Nothing to audit.");
    return;
  }

  const browser = await chromium.launch();
  let failures = 0;

  for (const target of pages) {
    const issues = [];

    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      page.on("console", (m) => { if (m.type() === "error") pageErrors.push(m.text()); });

      await page.goto(pathToFileURL(target.url).href + (target.query ?? ""), { waitUntil: "load" });
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await page.waitForTimeout(250);

      await page.addScriptTag({ content: `window.__collect = ${collect.toString()}` });
      const { text, targets, hitMin } = await page.evaluate(
        ([a, b]) => window.__collect(a, b),
        [TEXT_SELECTOR, INTERACTIVE_SELECTOR]
      );

      for (const e of pageErrors) issues.push(`[${theme}] page error: ${e}`);

      const seen = new Set();
      for (const t of text) {
        // WCAG 1.4.3 exempts disabled controls; they are still checked for
        // being outright invisible, just at a lower bar.
        let bg = { r: 255, g: 255, b: 255, a: 1 };
        for (const c of t.stack.slice().reverse()) {
          const p = parseColor(c);
          if (p.a > 0) bg = composite(p, bg);
        }
        const fg = composite(parseColor(t.fg), bg);
        const key = `${theme}|${t.label}|${t.fg}|${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const large = t.size >= 18 || (t.size >= 14 && t.weight >= 700);
        const need = t.disabled ? 3 : large ? 3 : 4.5;
        const cr = contrast(fg, bg);
        if (cr < need) {
          issues.push(
            `[${theme}] contrast ${cr.toFixed(2)}:1 < ${need}  ${t.label} "${t.sample}" @${t.size}px${t.disabled ? " (disabled)" : ""}`
          );
        }
      }

      if (theme === "dark") {
        const seenT = new Set();
        for (const t of targets) {
          if (t.h >= hitMin && t.w >= hitMin) continue;
          const key = `${t.label}|${t.w}x${t.h}`;
          if (seenT.has(key)) continue;
          seenT.add(key);
          issues.push(`hit target ${t.w}×${t.h} < ${hitMin}px  ${t.label} "${t.sample}"`);
        }
      }

      await page.close();
    }

    if (issues.length) {
      failures += issues.length;
      console.log(`\n✗ ${target.name}`);
      for (const i of issues) console.log(`    ${i}`);
    } else {
      console.log(`✓ ${target.name}`);
    }
  }

  await browser.close();

  console.log(failures ? `\n${failures} issue${failures === 1 ? "" : "s"} found.` : "\nAll pages pass.");
  process.exit(failures ? 1 : 0);
};

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
