---
description: Apply the Paper System palette, type or scales to the token layer
argument-hint: [what changed, or leave blank to read docs/paper-system/]
---

Update `system/tokens.css` from the Paper System. Context: **$ARGUMENTS**

1. Read everything in `docs/paper-system/`. If that folder is still empty, say
   so and stop — the placeholder palette stays until the source documents are
   in the repo. Do not invent brand values.
2. Change **only** `system/tokens.css`. Raw values belong in the `--ramp-*`
   block; semantic tokens point at ramps. If a mockup or component needs
   editing to take the new palette, that is a bug — it means a raw value was
   inlined somewhere. Fix it there.
3. Remove the "PLACEHOLDER PALETTE" note at the top of the file once the real
   values are in, and replace it with a line saying where they came from.
4. Run `node tools/audit.mjs`. A palette swap is the most likely way to break
   contrast — expect findings and fix them by adjusting the ramp tints, not by
   weakening the check.
5. Render `system/preview.html` in both themes and check it actually looks
   right, not just that it passes.

Report which tokens changed and any contrast compromises the new palette forced.
