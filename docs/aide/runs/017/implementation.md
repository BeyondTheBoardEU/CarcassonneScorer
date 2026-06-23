# Implementation Report — Item 017
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-22

## Summary
Built manual score entry (`packages/web/src/score-entry/`): `ScoreEntry.tsx` renders one `PlayerEntryRow` per session player, each offering quick +1/+2/+5/-1 buttons and a custom-amount form (integer, may be negative, with an optional reason). Every control dispatches through `useGame().addScore(playerId, delta, reason?)` only — no tally arithmetic lives in the UI. Composed `ScoreEntry` into `PlayView` in `App.tsx`, retiring the Item 014 scratch placeholder (`totals-list` + `add-score-*` buttons) while keeping the real `new-game` control; `App.test.tsx`'s one assertion against the removed placeholder now targets the real `scoreboard-total-p1` testid.

## Files changed
- `packages/web/src/score-entry/PlayerEntryRow.tsx` — new: per-player quick increments + custom-amount/reason form; UI validation (blank/zero/non-integer rejected, dispatches nothing); accessible names identify the player by text (name + colour name), not colour alone.
- `packages/web/src/score-entry/ScoreEntry.tsx` — new: maps `session.players` to `PlayerEntryRow`s, wiring each row's `onApply` straight to `useGame().addScore`; renders `null` with no session (mirrors `Scoreboard`'s guard).
- `packages/web/src/score-entry/index.ts` — new barrel, mirrors `scoreboard/index.ts`/`setup/index.ts`.
- `packages/web/src/App.tsx` — `PlayView` now renders `Scoreboard` + `ScoreEntry` + a real `new-game` button; removed the Item 014 `totals-list`/`add-score-${id}` scratch placeholder and the now-unused `totals`/`addScore` destructuring; updated the `App` doc comment to reflect Item 017 landing.
- `packages/web/test/App.test.tsx` — the seeded-session assertion now reads `scoreboard-total-p1` instead of the removed `total-p1`; all other assertions were already against real testids (`start-game`, `play-view`, `setup-view`, `new-game`) and are unchanged.

## Tests added/updated
- `packages/web/test/score-entry.test.tsx` (new, 13 tests), rendered through the real `App` (seeded via `initialSession`) plus a small `SessionHarness` (renders `Scoreboard`+`ScoreEntry` and surfaces `session.events.at(-1)` as text) for the two tests that need to inspect the dispatched `ScoreEvent` directly:
  - quick increment (+5) updates the scoreboard total immediately
  - quick decrement (-1) reduces the total
  - custom +7 applies correctly; custom +10 then -3 nets to 7
  - zero / blank / non-integer (`3.5`, `abc`) custom amounts dispatch nothing (total unchanged)
  - a reason on a custom entry lands on the dispatched event's `reason` (asserted via the harness's `last-event-reason`, i.e. real store/session state); a quick-add with no reason leaves `reason` empty on the event
  - independent entry across 3 players in one render
  - target player identified by name + colour name (not colour alone) via `aria-label` and visible text
  - placeholder retirement: `totals-list`/`add-score-p1` are gone; `scoreboard`/`new-game` remain
- `packages/web/test/App.test.tsx` — existing seeded-session test updated to assert `scoreboard-total-p1` (no new test added; reconciliation only, per spec).

All other existing suites (core Items 001–013, web Items 014–016) were re-run unmodified and remain green.

## How to verify
- `npm run lint && npm run build && npm test` from the repo root (all green: 17 test files / 329 tests passed; build emits `dist/` via `vite build` with no TS errors).
- Manual: `npm run dev`, start a game, click quick +1/+2/+5/-1 and submit a custom amount (incl. negative and with a reason) for several players — the scoreboard total for each updates immediately and independently.

## Decisions (for doc-updater)
- **Validation regex (`^[+-]?\d+$`)** for the custom amount: accepts an optional leading sign plus digits only, so `"3.5"`, `"1e2"`, `""`, and non-numeric input are all rejected without dispatching, per the spec's "non-zero integer" requirement; `Number.parseInt` is only reached after this guard passes.
- **Quick-delta set fixed at `[1, 2, 5, -1]`** per the spec's example set ("+1/+2/+5 and a −1"); kept as a module-level constant in `PlayerEntryRow.tsx` rather than a prop, since no item in scope needs it configurable.
- **Form clears (`amount`/`reason` reset to `""`) only on an accepted submit** — a rejected (blank/zero/non-integer) submission leaves the user's typed value in place so they can see/correct it, rather than silently wiping it.
- **`PlayView` no longer destructures `totals`/`addScore` from `useGame()`** — those are now consumed inside `Scoreboard`/`ScoreEntry` respectively; `PlayView` itself only needs `session`/`newGame`, keeping it free of any tally-adjacent state.
- **Reason-carrying test asserts against real session state, not DOM text** — added a tiny `SessionHarness` test-only component (in `score-entry.test.tsx`, not shipped) exposing `session.events.at(-1)` so the test reads the actual dispatched `ScoreEvent.reason`/`delta` rather than inferring it indirectly, since Item 018 (not this item) owns displaying event history in the DOM.

## Blockers
None.
