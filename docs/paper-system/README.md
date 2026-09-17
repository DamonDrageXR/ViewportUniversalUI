# Paper System — Viewport XR

**This folder is empty on purpose. Put the Paper System documents here.**

Copy the `.md` files from `Downloads\Paper System — Viewport XR` into this
folder and commit them. They are the reference the design system is derived
from, and keeping them in the repo means the tokens and the reasoning behind
them stay together.

## Why they are not here already

The session that scaffolded this repo ran in a cloud container, not on the
Viewport machine, so `C:\Users\...\Downloads\` was not reachable from it and
the files were not in Drive either.

## What changes once they are in

The `Viewport XR v1` system carries a **placeholder palette**. Applying the
real one is a change to that system's globals, not a rewrite of any CSS:

- The brand accent goes in **Accent colour**; the accent ramp and the
  contrast-safe fill are derived from it.
- The neutral cast goes in **Neutral hue** and **Neutral saturation**.
- Corner radius, spacing unit, base text size and type scale each have a
  global.
- The typeface goes in **Interface font**. Only system stacks are offered, so
  a mockup renders identically offline with no font to fetch or licence — if
  the Paper System names a licensed face, add it to `fonts` in
  `system/schema.json` with a sensible fallback stack.

Anything the Paper System specifies that does not fall out of a global goes in
as an explicit token override, which the studio marks as **custom**.

**Do it as a new version.** Open the system, make the changes, and
**Save as new version** — that keeps the placeholder as v1 so the two can be
compared rather than one replacing the other.

Then run `npm run audit`. A new palette is the most likely way to introduce a
contrast failure. The derived roles protect the accent and status colours
automatically, but anything pinned as an override is on you.
