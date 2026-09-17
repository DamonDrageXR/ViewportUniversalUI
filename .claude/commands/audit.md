---
description: Run the accessibility audit and fix what it finds
---

Run `node tools/audit.mjs` and resolve every finding.

For each one:

- **Contrast failure** — fix it at the token level where the same pairing is
  used in more than one place, and locally only when it is genuinely a one-off.
  Reach for the right accent role (`--accent` vs `--accent-solid` vs
  `--accent-fg`) before inventing a new colour.
- **Hit target too small** — enlarge the target. Do not shrink `--hit-min`, and
  do not rely on a parent being big enough: the thing the user hits is the
  thing that gets measured.
- **Page error** — fix the underlying bug.

If you believe a finding is a false positive, fix the *check* in
`tools/audit.mjs` and explain why in the commit. Never add an exemption to make
a real failure disappear.

Re-run until it passes, then report what changed and what it fixes.
