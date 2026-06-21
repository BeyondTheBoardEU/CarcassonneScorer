# Implementation Report — Item 015
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-21

## Summary
Built the real game setup screen in `packages/web/src/setup/` (`SetupView.tsx` + `PlayerRow.tsx` + `ColourPicker.tsx` + small helpers), replacing the Item 014 setup placeholder in `App.tsx`. The form starts with 2 player rows, allows add up to 6 / remove down to 2 (controls disable at the bounds), each row has a labelled name input and a meeple-colour `<select>` sourced from `@carcassonne/core`'s `meepleColours`, colours stay distinct across rows (already-taken colours render as disabled `<option>`s, with distinct defaults pre-assigned per row), and "Start game" builds a `Player[]` (stable ids, empty name → "Player N") and calls `useGame().startGame(players)`. A `SessionError` backstop is caught and shown inline (`data-testid="setup-error"`) instead of crashing.

## Files changed
- `packages/web/src/setup/SetupView.tsx` — new: the setup form (drafts state, add/remove bounds via core's `MIN_PLAYERS`/`MAX_PLAYERS`, submit → `startGame`, `SessionError` backstop).
- `packages/web/src/setup/PlayerRow.tsx` — new: one row's name input + `ColourPicker` + remove button.
- `packages/web/src/setup/ColourPicker.tsx` — new: `<select>` sourced from `meepleColours`; each option's text is `"{name} ({pattern})"` (non-colour cue) and options already taken by another row are `disabled`.
- `packages/web/src/setup/types.ts` — new: local `PlayerDraft` shape (raw/untrimmed name + colourId, distinct from the core's `Player`).
- `packages/web/src/setup/ids.ts` — new: `generatePlayerId()` (mirrors `GameProvider`'s `generateEventId` pattern; kept out of a `.tsx` file so `react-refresh/only-export-components` stays satisfied).
- `packages/web/src/setup/index.ts` — new: barrel re-exporting `SetupView`.
- `packages/web/src/App.tsx` — removed the Item 014 placeholder `SetupView` (and its now-unused `useState`/`SessionError`/`Player` imports), importing the real `SetupView` from `./setup/index.js` instead; updated two doc comments to reflect Item 015 replacing the placeholder.

## Tests added/updated
- `packages/web/test/setup.test.tsx` — new suite (10 tests) covering: default 2 rows; add up to 6 with add disabled at 6; remove down to 2 with remove disabled at 2; typing a name; empty name → "Player N" in the created session; each colour option shows its name+pattern (non-colour cue); a colour taken by another row renders as a disabled `<option>`; the created session always has unique `colourId`s (tested at 6 players); successful submit creates the session and routes to play; a `SessionError` backstop (forced via a direct `fireEvent.change` to a disabled `<option>`'s value, since jsdom doesn't enforce the `disabled` attribute on programmatic value sets) is surfaced as an inline message without crashing.
- `packages/web/test/App.test.tsx` — updated: replaced the removed placeholder's `start-demo-game`/`start-invalid-game` button ids with `start-game` (the real form's submit, valid by default) in the setup→play and play→setup routing tests; removed the placeholder-specific `SessionError` test (now covered, with a real reachable trigger, in `setup.test.tsx`); renamed one test's title from "placeholder" to "view".

## How to verify
- `npm run lint && npm run build && npm test` (run from repo root) — all green: lint clean, `tsc --noEmit` + `vite build` succeed, 15 test files / 310 tests pass (Items 001–014 suites unchanged and green).

## Decisions (for doc-updater)
- Reused the core's exported `MIN_PLAYERS`/`MAX_PLAYERS` (Item 012) for the 2–6 bound rather than a new magic number, per the spec's explicit instruction.
- Colour distinctness is enforced via the HTML `disabled` attribute on already-taken `<option>`s (not by removing them), so a player can still see every colour exists while only unavailable ones are blocked — matches "disabled/prevented" wording in the spec.
- The colour's non-colour cue is rendered as visible option text `"{name} ({pattern})"` (e.g. "Red (solid)") rather than a separate icon/swatch element, since `<option>` content can't host arbitrary markup; the swatch hue is layered on as a `style.color` hint only, never the sole signal.
- `PlayerDraft` (local, untrimmed name) is kept distinct from the core's `Player` (trimmed/defaulted name) — trimming and the "Player N" fallback happen once, at submit time, so a row's input never visibly "jumps" to a placeholder while the user is still typing.
- The `SessionError` backstop path is intentionally unreachable through the UI alone (the form's own disabled-option prevention keeps colours distinct), so its test forces a duplicate colour through `fireEvent.change` directly on a disabled `<option>`'s value — documented inline in the test as relying on jsdom not enforcing `disabled` on programmatic value sets.
- `generatePlayerId()` lives in a non-component `.ts` file (`ids.ts`), mirroring the existing `context.ts` split, to keep `react-refresh/only-export-components` satisfied across all `.tsx` files in `setup/`.

## Blockers
None.
