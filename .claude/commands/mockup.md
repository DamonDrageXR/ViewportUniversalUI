---
description: Build a new UI mockup from a description
argument-hint: <what to build> [--device ipad-landscape|desktop|headset|phone|...]
---

Build a new mockup in this repo for: **$ARGUMENTS**

Follow this order:

1. Read `docs/conventions.md` and skim `system/components.css` so you use what
   already exists rather than re-inventing it.
2. Scaffold it: `node tools/new-mockup.mjs "<title>" --device <device>`.
   Pick the device from the request; default to `ipad-landscape` if the target
   is not stated, and say which you picked and why.
3. Build the layout inside the `<!-- Mockup starts here -->` block. Mockup-only
   layout CSS goes in the page's `<style>`; anything reusable goes in
   `system/components.css` with a specimen added to `system/preview.html`.
4. Fill in the `.stage__notes` block — the intent, and the open questions a
   reviewer should weigh in on. Do not leave the template text.
5. Run `node tools/audit.mjs` and fix what it finds. Do not exempt findings.
6. Run `node tools/reindex.mjs` so the gallery picks it up.
7. Render it and look at it before reporting done — a mockup that passes the
   audit can still be laid out badly.

Report the path, what you chose and why, and anything you left open.
