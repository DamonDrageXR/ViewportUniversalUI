---
description: Apply the Paper System palette to a system's globals
argument-hint: [target system id, or leave blank]
---

Apply the Paper System to a design system. Context: **$ARGUMENTS**

1. Read everything in `docs/paper-system/`. If that folder is still empty, say
   so and stop — the placeholder palette stays until the source documents are
   in the repo. Do not invent brand values.
2. Work on a **new version** of the target system, so the placeholder survives
   for comparison. Never overwrite the existing one.
3. Map the Paper System onto **globals first** — accent, neutral hue and
   saturation, corner radius, spacing unit, base text size, type scale, font,
   density. Most of a palette falls out of these. Use an explicit token
   override only for something no global can express, and say which and why.
4. Edit `systems/<id>/system.json`, then `npm run index`. Never hand-edit a
   generated `tokens.css`.
5. If the Paper System names a licensed typeface, add it to `fonts` in
   `system/schema.json` with a real fallback stack — a mockup has to render
   identically offline.
6. Run `npm run audit`. The derived roles protect the accent and status
   colours automatically; anything pinned as an override is not protected, so
   expect findings there and fix them at the source.
7. Render `system/preview.html?system=<id>` in both themes and check it looks
   right, not just that it passes.

Report which globals changed, which overrides you had to add and why, and any
contrast compromise the new palette forced.
