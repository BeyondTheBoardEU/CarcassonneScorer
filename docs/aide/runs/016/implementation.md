# Implementation Report — Item 016
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-21

## Summary
Built the always-visible scoreboard (`packages/web/src/scoreboard/`): `Scoreboard.tsx` renders one `PlayerScoreRow` per `session.players` entry, reading `session`/`totals` from `useGame()` and performing no arithmetic of its own. Each row shows the meeple colour swatch, a non-colour cue (`name`/`pattern`), and the current total, plus an accessible `aria-label` ("Alice (Red): 8 points"). Composed `<Scoreboard />` into `App.tsx`'s `PlayView`, replacing the Item 014 placeholder's scoreboard region (the old `totals-list`/buttons stayed, only to keep `App.test.tsx`'s pre-existing routing assertions valid — they duplicate, but do not replace, what `Scoreboard` now displays).

## Files changed
- `packages/web/src/scoreboard/PlayerScoreRow.tsx` — new: one row (swatch + colour name/pattern text + total + `aria-label`), reads `getMeepleColour(player.colourId)`; no totals math.
- `packages/web/src/scoreboard/Scoreboard.tsx` — new: maps `session.players` to `PlayerScoreRow`s with `total={totals[player.id] ?? 0}`; returns `null` if no session.
- `packages/web/src/scoreboard/index.ts` — new: barrel export, mirrors `setup/index.ts`/`state/index.ts` convention.
- `packages/web/src/App.tsx` — `PlayView` now renders `<Scoreboard />`; updated doc comments (Item 016 no longer "placeholder"); kept the existing `totals-list`/`add-score-*`/`new-game` testids/buttons untouched so `App.test.tsx`'s routing assertions keep passing without modification.

## Tests added/updated
- `packages/web/test/scoreboard.test.tsx` (new, 6 tests, rendered within `GameProvider` via `initialSession`):
  - all 3 seeded players rendered with name + non-colour cue text (`(Red, solid)` etc., not colour-only)
  - swatch element present with a non-empty `backgroundColor` alongside the textual cue
  - totals match a seeded session computed by the core: P1 (+5,+3)=8, P2 (-2)=-2, P3 (no events)=0
  - `aria-label` on a row reads "Alice (Red): 8 points"
  - reactivity: a harness `addScore("p1", 5)` button bumps the displayed P1 total from 8 to 13 (store-driven, proving no caching/staleness)
  - players render in `session.players` order

No existing test files were modified — `App.test.tsx`'s `total-${id}` / `add-score-${id}` / `new-game` testids were preserved as-is in `App.tsx`, so that suite needed no changes.

## How to verify
- `npm run lint && npm run build && npm test` from the repo root (all green: 16 test files, 316 tests passed, including the new `scoreboard.test.tsx`).
- Manual: `npm run dev -w @carcassonne/web`, start a game from setup — the scoreboard shows every player's swatch, colour name/pattern, and total (0 until Item 017 adds score entry).

## Decisions (for doc-updater)
- Kept the Item 014 `totals-list`/`add-score-*`/`new-game` markup in `PlayView` alongside the new `Scoreboard`, rather than deleting it, specifically to avoid touching `App.test.tsx` (out of scope per the task boundary: "stay in your lane"; the existing routing tests already pass and were not "covered by placeholder text" in a way that required rewriting — they assert on testids, not visible copy). Item 017 (score entry) is the natural point to retire this duplicate scratch UI once real score-entry controls replace the `add-score-*` buttons.
- Colour swatch rendered as a small inline `<span>` with `aria-hidden="true"` (decorative) since the accessible information is carried by the row's `aria-label` and the visible `(Name, pattern)` text — avoids redundant/conflicting screen-reader announcements.
- `PlayerScoreRow`'s `aria-label` omits the `pattern` token (uses `"Alice (Red): 12 points"` per the spec's own example), while the visible text shows `(Red, solid)`; both satisfy "colour never the sole signal" since the visible pattern text is independently sufficient and the label is independently sufficient as a textual score readout.
- `Scoreboard` returns `null` (not throwing) when `session` is absent — defensive, since the play view that mounts it is only reachable when a session exists, but keeps the component safe if reused standalone later.

## Blockers (none — Status: complete)
