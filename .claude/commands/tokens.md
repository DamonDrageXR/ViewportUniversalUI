---
description: Derive a system's globals and rules from a source design system
argument-hint: [target system id, or leave blank]
---

Apply the Paper System to a design system. Context: **$ARGUMENTS**

1. Read the source documents. For the Paper System they are in
   `docs/paper-system/` and it is already derived as `systems/paper-v1` — read
   that README first, because it lists the deliberate deviations and a "fix"
   that undoes one is a regression. For any other source, do not invent brand
   values: if the documents are not in the repo, say so and stop.
2. Work on a **new version** of the target system, so the placeholder survives
   for comparison. Never overwrite the existing one.
3. Map onto **globals first** — accent, the three status hues, neutral hue and
   saturation, corner radius, line weight, icon stroke ratio, spacing unit,
   base text size, type scale, fonts, density. Most of a palette falls out of
   these.
   Then onto **rules**, for anything structural: whether shadows exist, whether
   a button may be filled, whether colour is rationed, how disabled reads,
   which themes the system has. A rule is not a value, and trying to express
   one as a token is how a system ends up as a palette.
   Use an explicit token override only for what neither can express, and say
   which and why. Every override is a control that stops working.
4. Edit `systems/<id>/system.json`, then `npm run index`. Never hand-edit a
   generated `tokens.css`.
5. If the Paper System names a licensed typeface, add it to `fonts` in
   `system/schema.json` with a real fallback stack — a mockup has to render
   identically offline.
6. Run `npm run audit`. The derived roles protect the accent and status
   colours automatically; anything pinned as an override is not protected, so
   expect findings there and fix them at the source.
7. Render `system/preview.html?system=<id>` in every theme the system declares
   (a light-only system has one) and check it looks
   right, not just that it passes.

Report which globals changed, which overrides you had to add and why, and any
contrast compromise the new palette forced.
