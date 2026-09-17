# Viewport Universal UI

Design systems and mockups for Viewport XR — the UI that ships on iPad AR in
the field, desktop review tools, and headset builds.

## Shape of the repo

```
system/       the engine, shared by every system:
              base.css · components.css · stage.css/js · nav.css/js
              tiles.css/js · inspector.css/js · use-tokens.js · icons.js
              schema.json — what a system contains and how it may be edited
              preview.html — the elements page (?system=<id>&view=elements)
systems/      one folder per system VERSION:
              <family>-v<n>/system.json   globals + explicit overrides
              <family>-v<n>/tokens.css    GENERATED — never hand-edit
              <family>-v<n>/mockups/<family>-v<n>/{index.html, mockup.json}
              manifest.js — GENERATED index
studio/       the editing app (needs the server):
              index.html   tile view 1 — systems
              mockups.html tile view 2 — mockups, re-renderable with any system
              system.html  one system: Settings → Elements → Mockups
templates/    mockup.html
tools/        studio.mjs · new-mockup.mjs · reindex.mjs · audit.mjs
              lib/system.mjs (derivation + file ops) · lib/color.mjs
index.html    read-only overview; works from file://
```

## Systems are data, not CSS

`systems/<id>/tokens.css` is **generated**. Edit `system.json` or use the
studio; never edit the CSS, it is overwritten on the next reindex.

A system has:
- **globals** — ~11 values (accent, neutral hue, radius, spacing unit, base
  text size, type scale, fonts, density, panel opacity).
- **overrides** — explicit per-token pins, in three scopes: `shared`, `dark`,
  `light`. An override wins over the derived value and is shown as "custom"
  in the studio.

Everything else is derived by `tools/lib/system.mjs`. Change one global and the
whole system moves with it.

### Derived contrast is a guarantee, not a suggestion

`--accent-solid` / `--accent-fg` / `--status-*-fg` are computed by walking
lightness until they clear 4.5:1 against the surface they actually sit on.
A sweep of 432 accent/theme combinations across the hue circle stays above AA.

If you add a colour role, derive it the same way — do not hand-pick a hex and
hope. `C.solidFor(hex, against, target)` and `C.fgFor(hex, against, target)`
in `tools/lib/color.mjs` are there for this.

## Versions are explicit and never overwrite

Ids are `<family>-v<n>` for both systems and mockups. "New version" copies
forward and leaves the source untouched. Nothing but an explicit delete ever
removes a version. Keep it that way — the whole point is being able to see
iterations side by side.

## Two views, one page per system

**Systems** (`studio/index.html`) is the design language — the settings and the
elements they produce. **Mockups** (`studio/mockups.html`) is what that language
looks like on a device; it can re-render every mockup with any system via
`?system=<id>`, which is how a palette change gets judged on real screens.

A system's own page reads top to bottom: **Settings → Elements → Mockups**.
Elements is an iframe of `system/preview.html?view=elements` with the draft
tokens injected, so it is the real page, interactive, not a picture of one.

## Icons

`system/icons.js` injects one inline SVG sprite. Use:

```html
<svg class="vp-icon" aria-hidden="true"><use href="#i-measure"></use></svg>
```

Icons carry no stroke-width of their own so they inherit `--stroke-icon`, which
means raising a system's line weight thickens them along with every border. Add
a new icon to the `PATHS` map — 24px grid, stroke only, no fills.

## Adding an editable token

Add it to `system/schema.json` under the right group and it appears in the
studio with the right control. **No studio code changes.** A group's `control`
is what constrains the UI, which is why a colour group can only ever offer
colour controls and a font group only font pickers.

If it also needs deriving from a global, add that to `deriveShared` or
`deriveTheme` in `tools/lib/system.mjs`.

## Commands

```bash
npm run studio    # http://localhost:4173/studio/ — create, edit, version, delete
npm run audit     # contrast (both themes, every system) + hit targets
npm run index     # rebuild manifest.js and regenerate every tokens.css
node tools/new-mockup.mjs "Title" --system <id> --device <device>
```

Devices: `ipad-landscape`, `ipad-portrait`, `desktop`, `desktop-wide`,
`headset`, `phone`.

## Before changing anything

Read `docs/conventions.md`. The ones broken most:

- **No raw values in a mockup.** Every colour, space, radius and font size
  comes from a token. An inlined hex is a value that will not move when the
  system does — which defeats the entire structure above.
- **Nothing interactive below `--hit-min`.** `--hit-xr` for ray or field use.
- **State is an ARIA attribute**, not a class: `aria-pressed`, `aria-selected`,
  `aria-expanded`.
- **Anything floating over the 3D scene needs its own backing.**

## Always run the audit

`npm run audit` renders every page, in both themes, once per system, with
translucent fills composited down the ancestor stack. It exits non-zero on
failure.

Do not "fix" a finding by exempting it. If a finding is a genuine false
positive, fix the *check* and say so in the commit.

## Page wiring

A page that renders with system tokens loads, in `<head>`, **synchronously**:

```html
<script src="<up>systems/manifest.js"></script>
<script src="<up>system/use-tokens.js"></script>
```

`use-tokens.js` resolves which system to use: `?system=<id>`, else the system
the page lives inside, else the manifest default. Never link a `tokens.css`
directly — that hard-wires a mockup to one system and breaks comparison.

`?chrome=0` suppresses the nav bar and inspector, for embedding a page in a
preview frame.

## Git

Work on the branch you were given. Commit the generated `tokens.css` and
`manifest.js` alongside their sources — they are build output, but keeping
them in the tree is what lets the repo be browsed without running anything.
