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

`system/tokens.css` currently carries a **placeholder palette** — a dark-first
XR tool theme, marked as placeholder at the top of the file. It is structured
so that the real values drop into that one file and re-theme every mockup in
the repo at once:

- Brand colours replace the `--ramp-*` values.
- The real typeface replaces `--font-sans`.
- Spacing, radius and type scales replace those sections if the Paper System
  specifies its own.

Nothing else needs to change, because no mockup contains a raw value.

After swapping them in, run `node tools/audit.mjs` — a new palette is the most
likely way to introduce a contrast failure, and the audit will catch it before
anyone sees it.
