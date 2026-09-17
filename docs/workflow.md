# Workflow

## Look at what exists

Open `index.html` — a read-only overview of every system and its mockups.
Double-clicking works; no server needed.

## Start the studio

```bash
npm install     # once
npm run studio  # http://localhost:4173/studio/
```

Everything you do in the studio writes real files under `systems/`. Nothing
lives in browser storage, so your work is in git and survives the machine.

## Create a system

**New system** in the studio makes `systems/<family>-v1/` from the defaults.
To branch from an existing one, open it and **Save as new version**.

## Edit a system

Open a system and you get:

- **Global settings** at the top, boxed in the accent colour because changing
  one cascades through every token below.
- **Token groups** underneath — surfaces, text, accent roles, status, radius,
  spacing, type, fonts, hit targets, motion, XR depth. Each group offers only
  the control its type allows.
- **Live preview** on the right, showing the draft rather than what is saved.
  Switch it between the style guide and any mockup in the system.

Pinning a token away from its derived value marks it **custom** with a reset
link, so it is never a mystery why a global stopped affecting something.

### Saving

- **Save** writes to the version you are editing.
- **Save as new version** copies forward and leaves the current one untouched.

Nothing auto-versions. A version is a deliberate step you took.

## Create a mockup

**New mockup** on a system tile, or:

```bash
node tools/new-mockup.mjs "Desktop review — measurement panel" \
     --system viewport-xr-v1 --device desktop
```

Devices: `ipad-landscape`, `ipad-portrait`, `desktop`, `desktop-wide`,
`headset`, `phone`.

Build the layout inside the `<!-- Mockup starts here -->` block using the
components in the style guide.

## Edit by clicking

Open a mockup from the studio and press **Inspect**. Hover highlights;
clicking shows which tokens that element actually resolves to — and only those,
with the right control for each. Changes apply live; **Save** writes them to
the system as overrides.

It is dormant when the page is opened without the studio server, because there
would be nowhere to save.

## Review

Every page carries a sticky bar: **← Gallery** and a **Prev / Next** pager
through everything. <kbd>←</kbd> <kbd>→</kbd> page, <kbd>Esc</kbd> goes back.
Arrow keys are handed back to whatever is focused, so a slider still works.

Mockups also get the stage bar: light theme, 8px grid, hit targets,
fit-to-window.

Then:

```bash
npm run audit          # everything
node tools/audit.mjs viewport-xr   # one system
```

Contrast in both themes with translucency composited properly, plus hit
targets, per system. Exits non-zero on failure.

## Compare a mockup across systems

Add `?system=<id>` to any mockup URL and it renders with that system's tokens
instead of its own. That is how you see whether a palette change actually works
on a real screen before committing to it.

## Status

The `Status:` field in a mockup's `.stage__meta` line drives its badge.
Use one of: `draft`, `review`, `approved`, `reference`, `superseded`.
`npm run index` picks up changes made by hand.

## Working with Claude

`CLAUDE.md` carries the architecture, so plain requests land inside it:

> Build a headset mockup in viewport-xr-v1 for the layer panel, one-handed.

> Make a v2 of the system with a warmer neutral and a tighter type scale.

> Run the audit and fix whatever it finds.
