# ViewportUniversalUI

Design systems and UI mockups for Viewport XR. Build a system, build mockups
with it, iterate without losing what came before.

## Two ways in

**Just looking** — open `index.html`. Read-only overview of every system and
its mockups. No install, works by double-clicking.

**Working on it** — run the studio:

```bash
npm install     # once, for the audit's headless browser
npm run studio  # http://localhost:4173/studio/
```

The studio is where you create, edit, version and delete. It writes real files
into `systems/`, so everything you do is in git, diffs like anything else, and
is still there next session.

## What you can do in the studio

**Tile view** of every system, grouped by family so versions read as a run.
Each tile shows the system's palette, its mockups as live thumbnails, and
buttons for New version / New mockup / Delete.

**System editor** with global settings at the top and every token below.
Change a global and the whole system moves with it, live.

**Click-to-edit** — open a mockup, hit **Inspect**, click anything. It tells
you which tokens that element actually resolves to and gives you the right
control for each: a colour picker for a colour, a slider for a radius, a font
picker for a font. Edits apply live and save back to the system.

## Nothing overwrites anything

Systems and mockups are both `<family>-v<n>`. **New version** copies forward
and leaves the original untouched, so you can put v1 and v4 side by side and
see what changed. The only thing that removes a version is you pressing
Delete, and that asks first.

## Globals cascade, and cannot break contrast

A system is derived from about eleven values — accent, neutral hue, corner
radius, spacing unit, base text size, type scale, fonts, density, panel
opacity. Everything else falls out of those.

The colours that carry text are **derived rather than picked**: `--accent-solid`
(the fill behind white text) and `--accent-fg` (accent text on a tinted chip)
are computed by walking lightness until they clear 4.5:1 against the surface
they actually sit on. Set the accent to any colour you like — a sweep of 432
accent and theme combinations across the full hue circle stays above AA.

Density works the same way: switch a system to **Field** and every hit target
in every mockup jumps to 56/64/72px, because that is what gloves and sun and
ray targeting need.

## Editors are constrained by type

`system/schema.json` describes what a system contains. A group declares its
`control`, and that decides the widget — so a colour group can only ever offer
colour controls, and a font group only font pickers. Adding a token to the
schema adds it to the studio with no code change.

## How it is put together

```
system/       the engine shared by every system — components, staging chrome,
              nav, tiles, inspector, and schema.json
systems/      one folder per system version: system.json (globals + overrides),
              a GENERATED tokens.css, and that system's mockups
studio/       the editing app
tools/        studio server, scaffolder, reindexer, audit
index.html    the read-only overview
```

`tokens.css` is generated from `system.json`. Never hand-edit it.

## Checking work

```bash
npm run audit
```

Renders every page in both themes, once per system, composites translucent
panel fills down the ancestor stack, and checks text contrast against WCAG AA
and every interactive element against `--hit-min`. Exits non-zero on failure.

## What is XR-specific about it

- **Hit targets are first-class** — `--hit-min` is a floor the audit enforces;
  `--hit-xr` is the floor for ray targeting and field use.
- **Panels are translucent**, because they sit over a live camera feed or 3D
  scene whose brightness nobody controls.
- **Elevation carries a real depth value** — `--depth-raised`, `--depth-float`
  and `--depth-modal` are millimetre z-offsets for the engine build, declared
  next to the shadows that stand in for them on a flat screen.
- **Device frames are true logical-pixel viewports**, and the headset frame
  shows a comfortable-reading vignette so it is obvious when something has
  been pushed out to where it needs a head turn.

## The Paper System

`docs/paper-system/` is the slot for the Paper System — Viewport XR source
documents, and it is still empty. Until they land, the `Viewport XR v1` system
carries a placeholder palette. Dropping the real values in is a change to one
system's globals — see [`docs/paper-system/README.md`](docs/paper-system/README.md).

## Conventions

Eight rules, each with the reason it exists:
[`docs/conventions.md`](docs/conventions.md).

## Working with Claude

`CLAUDE.md` carries the architecture and the rules. Slash commands:

| Command | What it does |
| --- | --- |
| `/mockup` | Build a new mockup from a description. |
| `/iterate` | Revise an existing mockup against feedback. |
| `/audit` | Run the audit and fix every finding. |
| `/tokens` | Apply the Paper System palette to a system's globals. |
