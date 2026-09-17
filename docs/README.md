# Docs

| File | What it is |
| --- | --- |
| [`conventions.md`](conventions.md) | The rules a mockup has to follow. Read before building one. |
| [`workflow.md`](workflow.md) | How to go from an idea to a reviewed mockup. |
| [`how-to-use.html`](how-to-use.html) | The same thing, rendered, for people who would rather not read Markdown. |
| [`paper-system/`](paper-system/) | **Drop the Paper System source documents here.** |

## paper-system/

This is the slot for the Paper System — Viewport XR documents. Copy the `.md`
files from `Downloads\Paper System — Viewport XR` into `docs/paper-system/`,
commit them, and they become the reference the token layer is derived from.

Until they are in place, `system/tokens.css` carries a **placeholder palette**
— a sane dark-first XR tool theme, clearly marked as such at the top of the
file. Nothing is hard-coded anywhere else, so replacing those values with the
real ones re-themes every mockup in the repo at once.
