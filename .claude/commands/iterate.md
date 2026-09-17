---
description: Revise an existing mockup or system against feedback
argument-hint: <mockup or system name> — <the change you want>
---

Revise existing work: **$ARGUMENTS**

1. Find it under `systems/`. If the reference is ambiguous — several versions,
   or the same mockup family in more than one system — list the candidates and
   ask which. Do not guess.
2. Decide whether this is a **new version** or an edit in place:
   - Changes the character of the thing, or is worth comparing against what is
     there now → new version. Systems: `POST /api/systems/<id>/version` or the
     studio. Mockups: copy to `<family>-v<n+1>`.
   - A fix, a typo, an unfinished draft → edit in place.
   Say which you chose and why. When in doubt, take the new version — nothing
   is lost that way.
3. Make the change, keeping it to what was asked. Do not tidy unrelated parts
   in the same pass.
4. If the change is really a system change (a colour that is wrong everywhere,
   a spacing step that does not exist), make it in the system's globals or
   overrides rather than patching one mockup.
5. Update `.stage__notes` if the intent or the open questions moved, and bump
   the `Updated` date.
6. `npm run index`, then `npm run audit`.
7. Render before and after, and describe what actually changed visually.
