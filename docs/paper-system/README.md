# Paper System — Viewport XR

The source documents for the Paper System, and the record of how it became
`systems/paper-v1`.

| File | What it is |
| --- | --- |
| [`rules.md`](rules.md) | The full Paper System rulebook — colour, type, spacing, components, do and don't. The original `readme.md` from the package. |
| [`SKILL.md`](SKILL.md) | The skill entry point, with the non-negotiable rules in short form. |
| [`HANDOVER.md`](HANDOVER.md) | What the original package contains, the spatial rulebook summary, and its open items. |
| [`tokens/`](tokens/) | The original token CSS, verbatim, for checking a derived value against the source. |

## It is derived now

An earlier session wrote here that "nothing in this repo is based on the Paper
System", because it ran in a cloud container that could not read the package on
the Viewport machine. That is no longer true, and this file used to say the
opposite of what is now the case.

`systems/paper-v1` **is** the Paper System, expressed as data. The package
itself stays where it is — `Downloads\Paper System — Viewport XR` — as the
source of truth for the original React specimen cards and the 19 spatial
mockups. Nothing here replaces it.

`systems/viewport-xr-v1` is still the invented placeholder it always was. It is
kept because having two systems is what makes the comparison in the Mockups
view mean anything; it is not a second opinion about the brand.

## How each Paper rule is carried

Three mechanisms, and which one a rule uses is the whole design:

**A global**, when the rule is a value everything else scales from.

| Paper rule | Global | Value |
| --- | --- | --- |
| Required-action ring is Blue `#2B71DC` | `accent` | `#2b71dc` |
| Traffic light: Good / Marginal / Poor | `statusPositive` / `statusCaution` / `statusCritical` | `#4da863` / `#fa9247` / `#e12b56` |
| Greys are neutral, never tinted | `neutralHue` 0, `neutralChroma` 0 | pure grey |
| 2px borders, 3px on frames and modals | `lineWeight` | `2` → `--stroke-hairline: 2px`, `--stroke-thin: 3px` |
| Icons are 2px stroke on a 24px grid | `iconStroke` | `1` → `--stroke-icon` equals the border weight |
| Spacing in multiples of 4 | `spaceUnit` | `4` |
| Body is 16px | `baseFontSize` | `16` |
| Patrick Hand for all text | `fontSans` | `hand` |
| Inter for chart numerals and meta | `fontMono` | `numeral` |

**A rule**, when it is structural — about whether a treatment is allowed at all.
These are the ones no token can carry, and they are reusable: any system can
opt into them.

| Paper rule | Rule | Value |
| --- | --- | --- |
| No drop shadow, lift, blur, glow or gradient | `shadows` | `none` |
| Buttons are white only; the required action carries a ring | `buttonFill` | `paper` |
| Colour means a status or the one required action | `colourPolicy` | `rationed` |
| Disabled is grey plus a 45° hatch | `disabledPattern` | `hatch-45` |
| Every surface is white; there is no dark Paper | `themes` | `light-only` |
| Feedback is the grey ladder, since nothing is filled | `controlFeedback` | `grey-ladder` |
| Numbers take the numeral face | `numeralFace` | `mono` |
| Drafted dividers are dashed | `dividerStyle` | `dashed` |

`colourPolicy: rationed` is also what makes **selected a black fill** rather
than a colour, across tools, tree rows, segmented options, tabs and toggles.
Paper states that rule directly; the reason it is worth enforcing is that
selection and warning must never look alike.

**An override**, only where the source pins a value that no global produces —
white on every surface, the ink and grey text steps, and ink borders in place
of the engine's low-alpha hairlines. Fourteen in total, all in the `light`
scope, all shown as **custom** in the studio.

## Where it deviates, and why

Honest list. Each is a consequence of the tokens being derived rather than
transcribed, which is what lets a slider move the whole system at once.

- **The type ladder is close, not identical.** Paper specifies 11 / 13 / 16 /
  18 / 22 / 28 / 34. A 1.22 ratio off a 16px base gives 12 / 14 / 16 / 20 / 24 /
  29 / 35. Pinning all seven as overrides would match the source exactly and
  would also stop the type-scale control doing anything, so the ratio was kept
  live. Pin them if exactness matters more than the control.
- **Radius.** Paper names card 16, input 10, button 8, image 8. The engine
  derives four steps from one number: 4 / 8 / 14 / 22. The button radius is
  exact; the card is 14 rather than 16.
- **Patrick Hand is not bundled.** `fontSans: hand` resolves to
  `"Patrick Hand", "Bradley Hand", "Comic Sans MS", cursive`. If the font is not
  installed, the page falls back — recognisably hand-drawn, but not the right
  face. Install it, or bundle the OFL `.woff2` in the repo and add an
  `@font-face` to `system/base.css`.
- **Icon stroke scales with the icon.** `--stroke-icon` is in the SVG's user
  units on a 24px grid, so a 16px icon draws its 2px stroke at about 1.3px on
  screen. That is how SVG scales a drawing, and it is why the ratio is a
  separate control.

## Checking a value against the source

`tokens/` here is the original CSS, unmodified. To check the engine against it:

```bash
grep -r "paper-gray-2" docs/paper-system/tokens/     # the source value
grep    "surface-sunken" systems/paper-v1/tokens.css  # what is generated
```

## The original package

Still the reference for anything not ported: the React specimen cards, the icon
registry of 450 glyphs, the three deployment walls (iPad ×7, Headset ×6,
Desktop ×6) and the Spatial Rulebook itself.

It also has a browsable viewer at its root — `_viewer.html` — which lists every
card, wall and kit in one place and opens each at its declared viewport. It
needs the package served over HTTP, because several pages load `.jsx` through
Babel and `file://` blocks the fetch:

```bash
cd "/c/Users/<you>/Downloads/Paper System — Viewport XR"
python -m http.server 8787
# then open http://127.0.0.1:8787/_viewer.html
```

The three mockups in `systems/paper-v1/mockups/` are the rulebook's three
states rebuilt as token-driven screens, so the configurator drives them. The
remaining 16 spatial mockups live only in the package.
