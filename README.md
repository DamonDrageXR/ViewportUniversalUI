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

## Two views

**Systems** — the design language. Palette, fonts, line weights, corner radius,
spacing, type scale, density, and every element those produce: buttons, sliders,
icons, menus, panels, trees.

**Mockups** — what that language looks like on a device. **One tile per mockup**,
holding a screen for each device it covers: phone, iPad portrait, iPad
landscape, desktop, headset. Pick a different system at the top and every
screen re-renders with it, so a palette, line weight or density change can be
judged on real screens before you commit to it.

## A system reads top to bottom

Open one and you get three sections in order:

1. **Settings** — globals first, then every token, each group offering only the
   control its type allows.
2. **Elements** — the live, interactive component library with those settings
   applied. Not a picture: the real page, embedded.
3. **Mockups** — the mockups built with this system, each showing all of its
   screens at once.

## Click-to-edit

Open a mockup, hit **Inspect**, click anything. It tells you which tokens that element
actually resolves to and gives you the right control for each: a colour picker
for a colour, a slider for a radius, a font picker for a font. Edits apply live
and save back to the system.

## Nothing overwrites anything

Systems and mockups are both `<family>-v<n>`. **New version** copies forward
and leaves the original untouched, so you can put v1 and v4 side by side and
see what changed. The only thing that removes a version is you pressing
Delete, and that asks first.

## Globals cascade, and cannot break contrast

A system is derived from about sixteen values — accent, the three status hues,
neutral hue and saturation, corner radius, line weight, icon stroke ratio,
spacing unit, base text size, type scale, fonts, density, panel opacity.
Everything else falls out of those.

The colours that carry text are **derived rather than picked**: `--accent-solid`
(the fill behind white text) and `--accent-fg` (accent text on a tinted chip)
are computed by walking lightness until they clear 4.5:1 against the surface
they actually sit on. Set the accent to any colour you like — a sweep of 432
accent and theme combinations across the full hue circle stays above AA.

Density works the same way: switch a system to **Field** and every hit target
in every mockup jumps to 56/64/72px, because that is what gloves and sun and
ray targeting need. **Line weight** likewise drives every border, divider and
icon stroke from one number, so icons thicken with the rest of the system
instead of drifting thin against heavier borders.

## Editors are constrained by type

`system/schema.json` describes what a system contains. A group declares its
`control`, and that decides the widget — so a colour group can only ever offer
colour controls, and a font group only font pickers. Adding a token to the
schema adds it to the studio with no code change.

## How it is put together

```
system/       the engine shared by every system — components, staging chrome,
              nav, tiles, inspector, icons, and schema.json
systems/      one folder per system version: system.json (globals + overrides),
              a GENERATED tokens.css, and that system's mockups
studio/       the editing app — systems view, mockups view, system page
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

`systems/paper-v1` **is** the Paper System — Viewport XR, expressed as data:
light-only, 2px ink line work, Patrick Hand, greyscale carrying all structure,
and colour rationed to a status or the single required action. Its three
mockups are the spatial rulebook's three states — outside the experience,
configuring it, running it — with a screen per device.

`systems/viewport-xr-v1` is an invented placeholder, kept because comparing one
mockup across two systems is what the Mockups view is for.

[`docs/paper-system/`](docs/paper-system/) holds the source rulebook and maps
every Paper rule to the global, rule or override that carries it — including
the four places the derivation deviates from the source, and why.

**Patrick Hand is not bundled.** It falls back to Bradley Hand then Comic Sans,
which is recognisably hand-drawn but is not the right face. Install the font,
or bundle the OFL `.woff2` and add an `@font-face` to `system/base.css`.

## Rules, not just tokens

Two systems can share every token and still not be the same language. So a
system also declares **rules** — whether a treatment is allowed at all:

| Rule | What it decides |
| --- | --- |
| `shadows` | Soft shadows, or none at all — hierarchy from border, fill, size and spacing. |
| `buttonFill` | Accent fill on the primary action, or paper-only with a ring. |
| `colourPolicy` | Open, or rationed to status and the one required action. |
| `disabledPattern` | Dimmed, or grey plus a 45° hatch. |
| `themes` | Both, light-only or dark-only. |
| `controlFeedback` | Shade the fill, or the grey ladder for unfilled controls. |
| `numeralFace` | Interface face, or monospace for anything read as a number. |
| `dividerStyle` | Solid, or dashed so it reads as drafted. |

They live in the Rules panel on a system's page, next to the globals. A rule
added to `system/schema.json` and styled in the RULES LAYER of
`system/components.css` becomes available to every system at once, which is the
point of keeping them out of any one system's CSS.

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
| `/tokens` | Derive a system's globals and rules from a source design system. |
