# ViewportUniversalUI

The Universal UI guidelines and designs for Viewport XR — a design system plus
a workshop for building, iterating on and reviewing UI mockups.

## Open it

| | |
| --- | --- |
| **`index.html`** | The gallery — every mockup in the repo. |
| **`system/preview.html`** | The component library itself, rendered. |
| **`docs/how-to-use.html`** | How all of this works. |

Double-click any of them. There is no build step, no framework and nothing to
install to look at a mockup. If you want a real origin, `npm run serve`.

## Make something

```bash
node tools/new-mockup.mjs "Desktop review — measurement panel" --device desktop
```

Devices: `ipad-landscape`, `ipad-portrait`, `desktop`, `desktop-wide`,
`headset`, `phone`. The device frames are the real logical-pixel viewports of
the hardware Viewport ships to, so type size and hit targets are judged at true
scale rather than "looks fine on my laptop".

Then build inside the `<!-- Mockup starts here -->` block using the components
in the system preview, and:

```bash
node tools/audit.mjs      # contrast (both themes) + hit targets
node tools/reindex.mjs    # refresh the gallery
```

## How it is put together

```
system/       tokens.css · base.css · components.css · stage.css · stage.js
              nav.css · nav.js · preview.html
templates/    mockup.html
mockups/      <nnn>-<slug>/index.html
gallery/      manifest.js
docs/         conventions.md · workflow.md · how-to-use.html · paper-system/
tools/        new-mockup.mjs · reindex.mjs · audit.mjs
```

`system/tokens.css` is the single source of truth. Every colour, space, radius,
duration and font size in every mockup resolves back to a token in that file,
which is what makes a palette swap a one-file change.

Each mockup gets a review bar automatically: light-theme toggle, an 8px grid
overlay, a hit-target overlay, and fit-to-window scaling that shrinks the frame
without changing the layout maths inside it.

## What is XR-specific about it

This is not a generic web design system with a dark mode.

- **Hit targets are first-class.** `--hit-min` (44px) is a floor the audit
  enforces; `--hit-xr` (64px) is the floor for anything a hand or controller
  ray has to catch, or anything used in gloves, in sun, on uneven ground.
- **Panels are translucent by default**, because they sit over a live camera
  feed or 3D scene whose brightness nobody controls — and anything floating
  over that scene is required to carry its own backing.
- **Elevation carries a real depth value.** `--depth-raised`, `--depth-float`
  and `--depth-modal` are z-offsets in millimetres, declared next to the
  shadows that represent them on a flat screen, so the 2D mockup and the engine
  build do not drift apart.
- **The headset frame shows a comfortable-reading vignette**, so it is obvious
  when something has been pushed out to where it needs a head turn.

## The Paper System

`docs/paper-system/` is the slot for the Paper System — Viewport XR source
documents, and it is currently empty. Until they land, `system/tokens.css`
carries a placeholder palette, marked as such at the top of the file.

See [`docs/paper-system/README.md`](docs/paper-system/README.md) for what to
copy in and what changes when it is there.

## Conventions

Eight rules, each with the reason it exists:
[`docs/conventions.md`](docs/conventions.md).

## Working with Claude

`CLAUDE.md` carries the conventions, so plain-language requests land inside the
system. Four slash commands are set up:

| Command | What it does |
| --- | --- |
| `/mockup` | Build a new mockup from a description. |
| `/iterate` | Revise an existing mockup against feedback. |
| `/audit` | Run the audit and fix every finding. |
| `/tokens` | Apply the Paper System palette to the token layer. |
