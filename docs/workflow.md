# Workflow

## Look at what exists

Open `index.html` in a browser — that is the gallery of every mockup. Open
`system/preview.html` to see the component library itself.

No server needed; double-clicking the file works. If you would rather have a
real origin (so `localStorage` and relative paths behave exactly as they would
deployed), run `npm run serve`.

## Make a new mockup

```bash
node tools/new-mockup.mjs "Desktop review — measurement panel" --device desktop
```

Devices: `ipad-landscape`, `ipad-portrait`, `desktop`, `desktop-wide`,
`headset`, `phone`.

That creates `mockups/<nnn>-<slug>/index.html` from the template, with the
title, date and device frame filled in, and updates the gallery.

Then build the layout inside the `<!-- Mockup starts here -->` block using the
components in `system/preview.html`.

## Review it

Every mockup gets a control bar, injected automatically:

| Control | What it shows |
| --- | --- |
| **Light theme** | The same layout in the other theme. Both have to work. |
| **8px grid** | Whether spacing is actually on the scale or just close to it. |
| **Hit targets** | Outlines every interactive element. Anything that looks small, is. |
| **Fit to window** | Scales the device frame to your monitor without changing the layout maths inside it. |

Every page also gets a sticky bar at the top: **← Gallery**, and a **Prev /
Next** pager through every page in the repo. <kbd>←</kbd> and <kbd>→</kbd> page
through, <kbd>Esc</kbd> goes back to the gallery. Arrow keys are handed back to
whatever is focused, so a slider still works normally.

The pager order comes from `gallery/manifest.js` — run `node tools/reindex.mjs`
after adding a mockup or it will not show up in the run.

Then run the audit:

```bash
node tools/audit.mjs          # everything
node tools/audit.mjs 003      # one mockup
```

It checks text contrast in both themes with translucent fills composited down
the ancestor stack, and checks every interactive element against `--hit-min`.
It exits non-zero on failure, so it can gate a commit.

## Iterate

Change it and reload. There is no build step and nothing to restart.

When a pattern shows up in a second mockup, promote it into
`system/components.css` and add a specimen to `system/preview.html` in the same
commit.

## Status

The `Status:` field in a mockup's `.stage__meta` line drives the badge in the
gallery. Use one of: `draft`, `review`, `approved`, `reference`, `superseded`.
Run `node tools/reindex.mjs` after changing it.

## Working with Claude

`CLAUDE.md` at the repo root tells Claude the conventions, so you can ask for
work in plain terms and get something that fits the system:

> Build a headset mockup for the layer panel, one-handed, with the tool rail
> reachable without moving your head.

> The tool rail is too dense at 5 tools — show me a version with grouping.

> Run the audit and fix whatever it finds.
