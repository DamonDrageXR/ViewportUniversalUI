# Paper System — Viewport XR

A deliberately narrow, low-fidelity **UI language for wireframes that grow into fully functional prototypes**, across web, mobile, tablet and spatial (Quest / AR). The draft *look* is fixed; the *behaviour* becomes real as a prototype matures. It is general purpose — not built around any single product.

> One typeface, black on white, line-art icons, clean live charts. **Colour is rationed to two jobs only: show a status, or outline a required action.** Nothing casts a shadow. This very design system is built on those rules.

**Owner:** Viewport XR · **Locale:** Australian spelling, AUD, no em dashes.

---

## Sources (provenance)

This design system was reconstructed from materials the author provided. You may not have access, but they are recorded here:

- **`uploads/DESIGN.md`** — the authoritative machine spec (the fixed core). If anything conflicts, DESIGN.md wins.
- **`uploads/HANDOVER.md`** — the long-form technical bible (reasoning, anatomy, caveats).
- **`uploads/paper-system-bible.html`** — the whole system rendered live, interactive, and built using its own rules. The CSS/markup here is the canonical reference our components mirror.
- **`uploads/Paper Wireframe Kit (Community).pdf`** + zips — the source kit export.
- **Figma:** *Paper Wireframe Kit (Community)* — pages `/Components`, `/Examples`, `/Stickers`, `/Welcome`. Font **Patrick Hand**; accents are **Crayola** crayon colours. All hex values and the icon library are sampled from the kit.
- **`assets/kit-icons.js`** — 166 real line-art glyphs (9 categories) extracted from the kit, used by the icon specimen card.

A note from the author: the raw `.fig` is a compressed proprietary binary and not a useful AI input on its own — pair `DESIGN.md` with a rendered reference (which is exactly what `paper-system-bible.html` provides).

---

## CONTENT FUNDAMENTALS — how copy is written

The tone is **plain, instructive and honest** — it reads like a careful draft, never marketing.

- **Verb-first, always.** A button label is a promise of what tapping does, so it leads with the verb. *"Save changes"*, not *"OK"*. *"Create account"*, not *"Submit"*. *"Delete file"*, not *"Yes"* (destructive actions name their target). *"Skip for now"*, not *"No thanks"*. Parallel pairs read as opposites: *Go back / Continue*, *Skip / Confirm*.
- **Voice.** Second person and imperative for actions ("Tap a point to place a marker"). The system talks about itself in plain declaratives ("Colour is permitted for two things only").
- **Casing.** Sentence case for body, labels and buttons. UPPERCASE (with +2 tracking, set in Inter) only for small section/field labels. Headlines are sentence case.
- **No hype, no filler.** Short sentences. State the rule, then the reason. Do/don't pairs are common ("Colour may… / Colour may not…").
- **Honesty rule.** Never imply precision the data can't give; label units and reference frames; prefer an honest spread over a flattering single number. A wireframe must never be dressed up as a finished product.
- **Locale.** Australian spelling (colour, behaviour, organise), AUD currency, **no em dashes** — use a spaced en dash or a hyphen.
- **Emoji / exclamation:** essentially none. The only playful touches are the hand-drawn font itself and a small smiley sticker on section headers in the reference page.

Example voice, verbatim from the source: *"This is Viewport's custom design system for wireframing and prototyping… Colour is used for two things only: status, and outlining an action that is required."*

---

## VISUAL FOUNDATIONS

The whole language is **controlled by design** — few choices, so every screen looks like it came from the same hand.

- **Typeface.** One face — **Patrick Hand** — for *all* UI text. It signals "draft" while staying legible. A second font or a flat colour fill reads as "finished" and is banned. (Inter is used only for chart numerals and tiny meta labels so digits align — an implementation detail, not a second UI font.)
- **Colour vibe.** Black `#1B1B1B` on white `#FFFFFF`; an 8-step greyscale carries *all* structure. A full **Crayola crayon** palette ships as a reserve but is rationed: colour may *only* (1) show a status or (2) outline the one required action. No decoration, no branding, no category colour-coding. Selection is **black fill** (not colour); disabled is **grey + a 45° hatch** (not colour). Imagery, when present, is neutral line-art — no warm/cool grade, no grain, no photography by default.
- **Type scale.** Fixed steps, never in-between: Display Lg 46 · Display 34 · H1 28 · H2 22 · H3 18 · Body Lg 18 · Body 16 · Caption 13 · Tiny 11 · Uppercase Lg 14 · Uppercase 12. Don't go below 11px (Patrick Hand drops in legibility).
- **Spacing & grid.** Everything is a multiple of **4**: 4 · 8 · 12 · 16 · 24 · 32 · 48. Screen pad 16, card pad 16, card gap 12, section gap 24, row ≥ 44. Be space-conscious — fill width with `auto-fit` grids, align content to the top, no stretched empty boxes; 3-up collapses to 1-up below ~680.
- **Universal control height.** Every single-line capsule — button, input, select, accordion header — sizes its height from a **shared line-height (`--control-leading` 1.25) plus equal top/bottom padding (`--control-pad-y`)**, never a fixed or min height. So all controls of a given size share one height (base ≈ 44px with 16px text) and grow only when the font grows; the spacing above and below the text is always equal. Three steps: `--control-pad-y-sm / -y / -y-lg`.
- **Borders & strokes.** 2px standard line work; 3px heavy for device frames, modals and tooltips. Round caps and joins everywhere. In-card dividers are 2px dashed Gray 2; list dividers 2px solid black.
- **Elevation — none.** Nothing casts a drop shadow. Hierarchy comes from border weight, fill, size and spacing only. The **only** `box-shadow` permitted is a **ring** (no offset, no blur): the grey focus ring and the coloured action ring — those are outlines, not shadows. No blur, glow or gradient anywhere (a faint grid background on the login screen is the one decorative texture, and it is greyscale).
- **Corner radii.** Card 16 · Input 10 · Button/Image 8 · Pill full · Phone frame 40 · Tablet frame 26.
- **Cards.** White, 2px black border, radius 16, no shadow. That's it. Tighter nested cards use radius 14.
- **Buttons.** White only — never black or coloured fill. **Size sets hierarchy** (lg main / base / sm dense). The single required action carries a **coloured outline ring** (default Blue `#2B71DC`). Verb-first labels. One ring per view.
- **Hover / press / focus.** Hover = Gray 1 fill. Press = Gray 2 fill **+ a 1px downward nudge** (translateY(1px)). Focus = 3px grey ring. Required action = 3px colour ring at rest. Disabled = 45° hatch, Gray 3 border, Gray 4 text.
- **Motion.** Movement signals state change, never decoration. Values ease to target ~0.5s; live series scroll on a ~1.3s feed; toggles/progress animate their transitions; screen transitions slide by transform only. **Never fade essential content in from opacity 0.** Respect reduced-motion.
- **Transparency / blur.** Avoided. Scrims on modals are a flat low-opacity ink wash; no backdrop blur.
- **Charts.** Clean, crisp (canvas scaled to device pixel ratio), following the same rules. Neutral series are black/grey; status uses the traffic light. A wireframe's charts stay in paper mode — never dressed up as a finished live dashboard.
- **Devices.** Exact ratios: phone 390×844, tablet 834×1112, web 16:10, spatial panels ~720 wide. Internal scroll with scrollbars hidden so frames feel like real devices.

---

## ICONOGRAPHY

- **Style.** Line-art only — **2px stroke on a 24px grid, round caps, no fills** (the only sanctioned fills are image placeholders and the person glyph in avatars). Never import a filled, duotone or branded icon set. A missing glyph is drawn in the same 2px style.
- **The real kit set.** The Paper Wireframe Kit ships **hundreds** of glyphs across categories: Arrows, Symbols, Editing, People, Healthcare, Finance, Emotions, Placeholder, Brands and more. 166 of them are extracted verbatim into **`assets/kit-icons.js`** (PNG data-URIs) and shown on the *Kit icon library* specimen card — that is the authoritative breadth and style reference.
- **For building UI**, use the **`Icon`** component (`components/core/Icon.jsx`) — a curated set of ~36 line-art glyphs as inline SVG (chevrons, arrows, search, filter, bell, user, mail, calendar, charts, map-pin, etc.), all 2px stroke, colour inherited from the ink token, with `muted` and `fill` variants. Extend it in the same style rather than reaching for another library.
- **Emoji / unicode.** Not used as iconography. The status-bar battery/signal glyphs in device frames are simple block characters; that's the only place.

---

## Index / manifest

**Root**
- `styles.css` — global entry point (import this one file). `@import`s the token files below.
- `readme.md` — this guide. · `SKILL.md` — Agent-Skill front matter for Claude Code.

**`tokens/`** — `colors.css` (greyscale, crayons, semantic status/action), `typography.css` (Patrick Hand scale), `spacing.css` (4-base scale, radii, borders, device ratios, motion, hatch), `fonts.css` (Patrick Hand + Inter via Google Fonts), `base.css` (element defaults, `.paper-ic`, `.paper-uppercase`).

**`guidelines/`** — foundation specimen cards (Design System tab): greyscale, crayons, status (traffic light + extra), type (display, body/labels), spacing (scale, radii), and the kit icon library.

**`components/`** — reusable primitives (React; read off `window.PaperSystemViewportXR_73598b`):
- `core/` — Icon, Button + Fab, Card, StatusChip, Tag, Badge + CountBadge, Avatar
- `forms/` — Input, Select, Checkbox, Radio, Toggle
- `feedback/` — Toast, Tooltip, Progress
- `navigation/` — Tabs, Pagination, Breadcrumb, TabBar
- `disclosure/` — Accordion (+ AccordionItem), Modal
- `layout/` — Stack, PhoneFrame (+ StatusBar), TabletFrame, DesktopFrame
- `data/` — Chart (spark / line / area / bar / donut / gauge / radial, live)
- `media/` — ImagePlaceholder (line-art / solid-grey image slot · rect / rounded / circle · no-image cross · empty hatch · aspect ratios)

Thirty-three exports in all (30 components plus the `ICON_NAMES`, `AccordionItem` and `StatusBar` helpers), read off `window.PaperSystemViewportXR_73598b`. 94 design tokens; 19 Design System specimen cards (Brand · Colors · Components · Spacing · Type · Paper Dashboard). Starting points: `Button` (Core) and `paper-dashboard` (Web).

**`ui_kits/paper-dashboard/`** — interactive recreations: `index.html` (Acme Analytics web dashboard, also a Web starting point) and `mobile.html` (health / inbox / field-capture phones).

**`assets/`** — `kit-icons.js` (166 real kit glyphs across 9 categories — a partial sample of the full kit library; see the icon-library note below).

---

## Golden rules (no-slip checklist)

- Patrick Hand everywhere; no second typeface. Black on white; greys for structure.
- Buttons white only; size sets hierarchy; one required action carries a coloured ring; all states reactive.
- No drop shadows, lift, blur, glow or gradient (rings are outlines, allowed).
- Colour only for status (traffic light or any crayon) or to outline a required action.
- Selected = black fill. Disabled = grey + hatch. Neither is a faded colour.
- Charts clean and live, never hand-sketched or faked. Verb-first labels.
- 2px borders (3px on frames/modals/tooltips), round caps. Spacing in multiples of 4; tokens only.
- Exact device ratios. Ship every state. Australian spelling, AUD, no em dashes.

---

### Font substitution note

Patrick Hand and Inter are loaded from **Google Fonts** (`tokens/fonts.css`) rather than self-hosted binaries, so the design-system compiler reports "Fonts: none" (it ships `@font-face` binaries, and these are remote). Both are the kit's confirmed faces, so no visual substitution was made — but if you need the design system to ship the font files offline, drop the `.woff2`/`.ttf` into `tokens/` and swap the `@import` for local `@font-face` rules. **Flag for the owner:** confirm whether self-hosted font binaries are required.
