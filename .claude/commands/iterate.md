---
description: Revise an existing mockup against feedback
argument-hint: <mockup slug or name> — <the change you want>
---

Revise an existing mockup: **$ARGUMENTS**

1. Find the mockup under `mockups/`. If the reference is ambiguous, list the
   candidates and ask which one rather than guessing.
2. Read it, and read `docs/conventions.md` if you have not this session.
3. Make the change. Keep it to what was asked — do not tidy unrelated parts of
   the mockup in the same pass.
4. If the change implies a system-level change (a new component, a missing
   token), make that change in `system/` rather than working around it locally,
   and add a specimen to `system/preview.html`.
5. Update the `.stage__notes` block if the intent or the open questions moved.
6. Bump the `Updated` date in `.stage__meta`, then `node tools/reindex.mjs`.
7. Run `node tools/audit.mjs`.
8. Render before and after, and describe what actually changed visually.
