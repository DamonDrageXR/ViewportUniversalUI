# Conventions

Short list. Each rule exists because breaking it has a specific cost.

## 1. No raw values in a mockup

Every colour, space, radius, duration and font size comes from a token. If the
value you want is not there, add it to `system/schema.json` — do not inline a
hex or a pixel.

*Why:* a mockup is meant to move when its system does, and to be viewable under
a different system with `?system=<id>`. Every inlined value is a place that
will not move, which defeats the whole structure.

## 2. Nothing interactive below `--hit-min`

44px is the floor, on every device. Use `--hit-xr` (64px) for anything driven
by a hand or controller ray, or used in the field.

*Why:* a control that is comfortable with a mouse is unusable through a
hand-tracked ray, in gloves, or on a tablet in direct sun. `node tools/audit.mjs`
enforces this.

## 3. Panels are translucent by default

XR UI sits over a live camera feed or a 3D scene whose brightness you do not
control. Use `.vp-panel`, and give any text or badge floating over the scene its
own backing.

*Why:* a status badge that reads perfectly over a dark pit reads as nothing at
all over pale ground.

## 4. State lives in ARIA attributes, not classes

Active tool is `aria-pressed="true"`. Selected row is `aria-selected="true"`.
Expanded folder is `aria-expanded="true"`.

*Why:* the mockup then describes the same state the engineer has to implement
and a screen reader has to announce, instead of a presentational shortcut that
has to be re-derived later.

## 5. Reusable goes in `components.css`, one-off goes in the mockup

Write a rule twice and it is a component. Promote it, add a specimen to
`system/preview.html`, and delete both copies.

*Why:* a component with no specimen is invisible, and the next person
re-invents it slightly differently.

## 6. A mockup states its intent and its open questions

Fill in the `.stage__notes` block. What question does this screen answer, and
what is still undecided?

*Why:* a mockup with no stated question gets reviewed on taste. One with a
stated question gets reviewed on whether it answers it.

## 7. Contrast is checked, not eyeballed

Run `node tools/audit.mjs` before you call a mockup done. It checks both themes
with translucency composited properly, and it checks hit targets.

*Why:* every one of these was caught by the audit and would have shipped
otherwise.

The audit composites background *colours*; it cannot sample a gradient or a
site photo behind the UI. A pass means the panel chrome is sound, not that
anything floating bare over the scene is legible — which is what rule 3 is
for.

## 8. Never hand-edit a generated file

`systems/<id>/tokens.css` and `systems/manifest.js` are generated. Edit
`system.json`, or use the studio, and run `npm run index`.

*Why:* the next reindex overwrites them, and your change vanishes without a
trace. If a value cannot be reached from a global or an override, that is a
gap in `system/schema.json` — fix it there.

## 9. Versions are explicit, and never overwrite

New work that changes the character of a system or a mockup goes in a new
version. Nothing auto-versions, and nothing but an explicit delete removes one.

*Why:* the point of the tile view is seeing iterations next to each other.
A version that was silently overwritten is one you cannot compare against.

## 10. Derive colours that carry text — do not pick them

`--accent-solid`, `--accent-fg` and `--status-*-fg` are computed by walking
lightness until they clear 4.5:1 against the surface they sit on. Add a new
colour role the same way, using `solidFor` / `fgFor` in `tools/lib/color.mjs`.

*Why:* a hand-picked hex is correct for exactly one palette. Every other
system, and every future palette change, silently breaks it.

## 11. Mockups are self-contained and build-free

One folder, one `index.html`, relative links to `system/`. No bundler, no
framework, no network fetch at render time. Tokens come in through
`use-tokens.js`, never a direct link to a `tokens.css`.

*Why:* a mockup has to still open in six months, on someone else's machine, by
double-clicking it.
