---
name: paper-system-design
description: Use this skill to generate well-branded interfaces and assets for the Paper System (Viewport XR) — a controlled wireframe-to-prototype UI language — for production or throwaway prototypes/mocks. Contains essential design guidelines, colours, type, fonts, the kit icon library, and UI-kit components for prototyping across web, mobile, tablet and spatial.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files (`DESIGN.md`-style rules live in `readme.md`; tokens in `tokens/`; primitives in `components/`; full screens in `ui_kits/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Link `styles.css` for tokens, and either reuse the component markup/CSS patterns from the UI kit or load the compiled bundle. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

Core, non-negotiable rules (full detail in `readme.md`):

- **Patrick Hand for all text**, black `#1B1B1B` on white `#FFFFFF`; greys carry all structure.
- **Buttons are white only** — size sets hierarchy; the single required action carries a coloured outline ring (default Blue `#2B71DC`). Verb-first labels ("Save changes", not "OK").
- **No drop shadows, lift, blur, glow or gradient.** The only `box-shadow` is a ring (focus / action). Hierarchy = border, fill, size, spacing.
- **Colour is permitted for exactly two things:** status (traffic light Good `#4DA863` / Marginal `#FA9247` / Poor `#E12B56`, or any crayon for extra states) and outlining the required action. Selected = black fill; disabled = grey + 45° hatch.
- **2px borders** (3px on device frames, modals, tooltips), round caps. Spacing in multiples of 4; radii/sizes/strokes from the token tables only.
- Line-art icons, 2px stroke on a 24px grid — use the `Icon` component or the kit set in `assets/kit-icons.js`; never a filled or branded set.
- Charts are clean and live, honest to the screen's fidelity. Exact device ratios (phone 390×844, tablet 834×1112, web 16:10).
- Australian spelling, AUD, no em dashes. Reads as a draft, behaves like a working prototype.

If the user invokes this skill without other guidance, ask them what they want to build or design, ask a few questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
