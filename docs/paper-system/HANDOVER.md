# Handover — Paper System — Viewport XR (design system project)

Portable package: this zip IS the whole system. To ingest into a fresh Claude Design
design-system project: recreate the file tree verbatim (skip `_ds_bundle.js`,
`_ds_manifest.json`, `_adherence.oxlintrc.json`, `scraps/`, `uploads/` — the compiler
regenerates the first three at every turn boundary; never hand-write them). Then run
`check_design_system` and confirm it validates clean. The namespace will differ in a new
project — update the `window.PaperSystemViewportXR_73598b` reads in every `*.card.html`
and `ui_kits/paper-dashboard/gallery.jsx` to the new namespace the validator reports.

## What this project is
A hand-drawn "paper wireframe" design system for a spatial creative-tech company.
Single UI typeface **Patrick Hand** (`--font-hand`); **Inter** only for chart numerals /
tiny meta labels (`--font-ui-numeral`). Greyscale carries all structure; colour is rationed
to two jobs — status, and the single Razzmatazz unread-count badge. Everything is tokenised
on a 4px base in `styles.css`; invent no raw values.

Components = a `<Name>.d.ts` + sibling `.jsx` per dir under `components/`
(core, data, disclosure, feedback, forms, layout, media, navigation). Specimen cards =
`.html` with `<!-- @dsCard group=… -->` on line 1, loading `_ds_bundle.js` off the namespace.

## The Spatial Rulebook (the crown of the system)
`index.html` = universal spatial UI rulebook. Core logic every mockup obeys:
- **3 states**: Outside experience (full menu, whole screen, paper-white — no spatial) /
  Config experience (spatial live but held: ONE wide edge-justified panel ≤35%, view stays
  open) / Active experience (thin strips ≤96px in reach zones; view ≥85% sacred).
- **Reach**: iPad thumbs = 60–80° corner arcs, centre = "ow zone"; long elements (sliders,
  carousels, timelines) bottom-only WITH arrow buttons both ends (+ swipe). Headset comfort
  band ±30° of eye line; panels anchored ~1m out, slightly below eye line, NEVER head-locked.
  Desktop allowance: compact type/capsules (denser menus) earned by pointer precision — the
  only per-target exception.
- **Spatial tags**: world-anchored labels, not UI — don't follow user, needn't be reachable,
  fade with distance.
- Headset active UI = wrist menus / curved keyboard-height strips / object-stuck menus.
- No web sign-in anywhere: pairing codes + join rooms.

Deployment walls (19 live mockups, each state-badged): `spatial/iPad.html` (7),
`spatial/Headset.html` (6), `spatial/Desktop.html` (6). Shared chrome in
`spatial/spatial-core.jsx` + `spatial/spatial.css`: grey faux-camera stage, white capsule
UI w/ cyan `--sp-select` ring + hover lift, drag-to-spin CSS-3D building/pot, TimeSlider,
CarouselBar (arrows mandatory), SpatialTag, annotation layer (blue dashed measurements,
green/red zones) with a persisted page-level Overlays on/off toggle.
Numbers table: min hit 44pt touch / 60pt gaze / 28px pointer; min body 17pt / 21pt@1m / 13px.

## Other surfaces
- `ui_kits/paper-dashboard/` — showcase wall (12 spatial/AR/pediatric mockups in paper
  device frames: `frames.jsx` iPhone/Basic/Panel) + Acme dashboard screens.
- `assets/kit-icons.js` — icon registry; Icon Library card shows the catalogue.
- `guidelines/`, `tokens/`, `readme.md`, `SKILL.md` — rules and token docs.
- `thumbnail.html` — homepage tile ("Paper XR" on ink + 4-swatch strip).

## Known screenshot gotcha
html-to-image substitutes Patrick Hand metrics and makes single-line labels LOOK wrapped.
They are NOT — verify text fit by measuring (eval_js getBoundingClientRect), not by eye.

## OPEN / PENDING
1. **Icon build-time trim** — registry is full-in-design (~881 KB); the trim-for-build split
   (ship only spec'd glyphs) is designed but not implemented.
2. **Modern device frames** — spatial/ has its own frames; the components/layout Phone/
   Tablet/Desktop frames predate them. Possible unification.
3. **Folder reorg** to match the user's Figma layout — acknowledged, deferred.
4. **@startingPoint → templates/** conversion for consuming projects — offered, not requested.

## First moves after ingest
1. `check_design_system` — fix namespace references until clean.
2. Open `index.html`, then the three `spatial/` walls, and the showcase wall — confirm all
   render with zero console errors and the Overlays toggle works.
