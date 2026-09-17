# Viewport Universal UI

Design system and mockup workshop for Viewport XR — the UI that ships on iPad
AR in the field, desktop review tools, and headset builds.

## What this repo is

Self-contained HTML mockups built from a shared token and component layer.
No framework, no bundler, no build step. A mockup is one folder with one
`index.html` that opens by double-clicking it.

```
system/       tokens.css · base.css · components.css · stage.css · stage.js
              nav.css · nav.js · preview.html
templates/    mockup.html — the starting point for a new mockup
mockups/      <nnn>-<slug>/index.html — one folder per mockup
gallery/      manifest.js — the index the root gallery reads
docs/         conventions.md · workflow.md · paper-system/
tools/        new-mockup.mjs · reindex.mjs · audit.mjs
index.html    the gallery
```

## Before changing anything

Read `docs/conventions.md`. It is eight rules, each with the reason it exists.
The ones that get broken most:

- **No raw values.** Every colour, space, radius, duration and font size comes
  from a token in `system/tokens.css`. If the value is missing, add a token.
  The palette is a placeholder that will be replaced wholesale — an inlined hex
  is a place that will silently keep the old colour.
- **Nothing interactive below `--hit-min` (44px).** Use `--hit-xr` (64px) for
  anything a hand or controller ray has to catch, or anything used in the field.
- **State is an ARIA attribute**, not a class: `aria-pressed`, `aria-selected`,
  `aria-expanded`.
- **Anything floating over the 3D scene needs its own backing.** Scene
  brightness is not controlled; a bare badge over pale ground disappears.

## Accent tokens have three roles

This trips people up, so it is worth stating plainly:

| Token | Use |
| --- | --- |
| `--accent` | Bright mark: outlines, selection, focus rings, accent text on a dark surface. |
| `--accent-solid` | Darker fill that carries **white text** — buttons, filled chips. |
| `--accent-fg` | Accent-coloured **text** on a tinted chip. |

Using `--accent` as a button fill is how a primary button ends up at 3.5:1.
The same split exists for status colours: `--status-critical`,
`--status-critical-solid`, `--status-critical-fg`.

## Commands

```bash
node tools/new-mockup.mjs "Title" --device ipad-landscape   # scaffold a mockup
node tools/reindex.mjs                                      # rebuild the gallery index
node tools/audit.mjs                                        # contrast + hit-target audit
npm run serve                                               # optional local server
```

Device frames: `ipad-landscape`, `ipad-portrait`, `desktop`, `desktop-wide`,
`headset`, `phone`.

## Always run the audit

`node tools/audit.mjs` before calling a mockup done. It renders every page in
both themes, composites translucent panel fills down the ancestor stack, and
checks text contrast against WCAG AA and every interactive element against
`--hit-min`. It exits non-zero on failure.

Do not "fix" a finding by exempting it from the audit. If a finding is a genuine
false positive, fix the *check* and say so.

## Review navigation

Every page except the gallery carries a sticky bar with a back link and a
prev/next pager (`system/nav.css` + `system/nav.js`, two lines in the page
head and body). `templates/mockup.html` already wires it, so a scaffolded
mockup gets it for free — do not add it by hand.

The pager order is built from `gallery/manifest.js`, so run
`node tools/reindex.mjs` after adding a mockup or it will not appear in the run.

## Adding a component

1. Add it to `system/components.css`, prefixed `vp-`, reading tokens only.
2. Add a live specimen to `system/preview.html` **in the same change**. A
   component with no specimen is invisible and gets re-invented.
3. Run the audit.

## The Paper System

`docs/paper-system/` is the slot for the Paper System — Viewport XR source
documents. It is empty until someone copies them in. `system/tokens.css` says
at the top that its palette is a placeholder; when the real values land, they
replace the `--ramp-*` values and `--font-sans` in that one file and everything
re-themes. Re-run the audit afterwards — a new palette is the most likely way
to introduce a contrast failure.

## Git

Work on the branch you were given. Commit mockup HTML and any token or
component change together, so a reviewer can see the system change and the
thing that motivated it in one diff.
