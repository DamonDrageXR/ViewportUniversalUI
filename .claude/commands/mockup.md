---
description: Build a new UI mockup from a description
argument-hint: <what to build> [--system <id>] [--device ipad-landscape|desktop|headset|...]
---

Build a new mockup: **$ARGUMENTS**

1. Read `docs/conventions.md` and skim `system/components.css` so you use what
   exists rather than re-inventing it.
2. Pick the system. If `--system` was not given and there is more than one
   family, list them and ask — do not guess which one this belongs to.
3. Scaffold it:
   `node tools/new-mockup.mjs "<title>" --system <id> --devices phone,ipad-portrait,ipad-landscape`
   A mockup is one idea across screen types, so it gets a screen per device.
   Default to those three unless the request names others; say which you picked.
4. Build **each screen** inside its `<!-- Mockup starts here -->` block. Give
   each device the job it is good at rather than rescaling one layout — the
   phone screen is not the landscape one squeezed. Mockup-only CSS goes in that
   page's `<style>`; anything reusable goes in `system/components.css` with a
   specimen added to `system/preview.html`.
5. Fill in each screen's `.stage__notes` block — the intent, and the open
   questions a reviewer should weigh in on. Do not leave the template text.
6. Run `npm run audit` and fix what it finds. Do not exempt findings.
7. Run `npm run index` so the manifest and tile view pick it up.
8. Render it and look at it before reporting done — a mockup that passes the
   audit can still be laid out badly.

Never edit a `tokens.css` to make a mockup look right. If a value is missing,
it belongs in `system/schema.json` and the system's globals or overrides.

Report the path, what you chose and why, and anything you left open.
