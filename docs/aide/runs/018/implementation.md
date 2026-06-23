# Implementation Report — Item 018
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-23

## Summary
Built the read-only score event log: `EventLog` (+ `EventLogRow`) in `packages/web/src/event-log/`, composed into the play view alongside the Item 016 `Scoreboard` and Item 017 `ScoreEntry`. It renders every entry in `session.events`, resolving each `playerId` to the player's name and a non-colour cue (via `getMeepleColour`), the signed point delta (explicit "+"/"−"), a readable local timestamp, and the reason when present — newest-first, with a clear empty-state message. No edits/reverses, no arithmetic, no new events; pure presentation read from `useGame()`.

## Files changed
- `packages/web/src/event-log/EventLogRow.tsx` — new. One row: resolves the colour cue from the (already-resolved) `player`, formats the signed delta (`formatDelta`: "+5"/"−3" text plus a "plus/minus N points" a11y label) and the timestamp (`formatTimestamp`: `Date(...).toLocaleString()`); renders the reason only when present (no "undefined" leakage); falls back to the raw `playerId` if the player can't be resolved (defensive, not expected in normal use).
- `packages/web/src/event-log/EventLog.tsx` — new. Reads `session.events`/`session.players` from `useGame()`; builds a `playersById` map (no per-row lookup duplication); renders a reversed shallow copy of `session.events` (**newest-first**, documented in the doc comment) inside a semantic `<ul>`; shows `"No score changes yet"` when there are no events; returns `null` when there's no session (mirrors `Scoreboard`/`ScoreEntry`'s guard).
- `packages/web/src/event-log/index.ts` — new barrel, mirrors `scoreboard/index.ts` / `score-entry/index.ts`.
- `packages/web/src/App.tsx` — composed `EventLog` into `PlayView` after `ScoreEntry`; updated the module doc comments (no behavioural change beyond rendering the log).

## Tests added/updated
- `packages/web/test/event-log.test.tsx` — new suite (7 tests), rendering `EventLog` under a `GameProvider` seeded via `initialSession`, with a thin `Harness` exposing `addScore` (mirrors the `Scoreboard` suite's harness pattern):
  - all seeded events render with correct player/cue, signed delta, and reason text; a reason-less entry renders with no reason node and never the literal string "undefined".
  - each entry shows a non-empty, human-readable local time (not the raw epoch-ms number).
  - dispatching a new `addScore` grows the rendered row count by one and the new event's delta appears.
  - explicit "+"/"−" sign-prefix assertions for positive/negative deltas.
  - an empty session shows the `"No score changes yet"` empty-state and zero rows.
  - order assertion: for a 3-event append-ordered seed (e1 oldest → e3 newest), rendered row order is `[e3, e2, e1]` — newest-first, deterministic from `session.events`.
  - read-only check: no `<button>` inside the `event-log` section (the harness's own add-button lives outside it).

## How to verify
- `npm run build` — exits 0 (tsc + vite build for `web`, tsc for `core`).
- `npm test` — exits 0, 18 test files / 336 tests pass, including the new `event-log.test.tsx` (7 tests) and all prior suites (Items 001–017) unchanged and green.
- `npx eslint .` — zero issues (the project's own `npm run lint` script also runs `prettier --check .`, which currently reports a pre-existing, untracked, out-of-scope file `.claude/hooks/aide-permission-gate.mjs` — not part of this item's deliverables or directory, and not modified by this change; confirmed via `npx prettier --check .claude/hooks/aide-permission-gate.mjs` failing identically in isolation). All files touched by this item (`packages/web/src/event-log/*`, `packages/web/src/App.tsx`, `packages/web/test/event-log.test.tsx`) are formatted (`npx prettier --check` on each passes) and lint-clean.

## Decisions (for doc-updater)
- **Order: newest-first.** `EventLog` renders a reversed shallow copy of the append-ordered `session.events`; documented in `EventLog.tsx`'s doc comment and exercised by a dedicated order test. Chosen per the spec's suggestion ("newest-first is common for a running log") — most relevant for "what just happened" at-a-glance.
- **Sign formatting.** Uses a Unicode minus sign ("−", U+2212) rather than a hyphen for negative deltas, paired with an explicit "+" for positive — both visually and via an `aria-label` reading "plus/minus N points" so screen readers don't rely on the glyph alone.
- **Timestamp formatting.** `new Date(timestamp).toLocaleString()` — locale-aware, readable, no extra dependency; matches the "readable local time" requirement without adding a date-formatting library.
- **Player resolution.** A `Map` built once per render from `session.players`, looked up per event — avoids an O(n·m) `.find()` per row and mirrors how `Scoreboard`/`ScoreEntry` read `session.players` directly (no new arithmetic, just an indexed lookup for display).
- **Defensive fallback.** If a `playerId` doesn't resolve (not expected — the core only emits events for known players, per Item 012's `addScoreEvent` guard), the row falls back to showing the raw id rather than throwing, so a single bad event can't crash the whole log.
- **No new test ids beyond `event-log-*`/`event-log-row-<id>`/`event-log-player-<id>`/`event-log-delta-<id>`/`event-log-time-<id>`/`event-log-reason-<id>`** — chosen to mirror the `scoreboard-*`/`score-entry-*` per-field `data-testid` convention already in the codebase.
