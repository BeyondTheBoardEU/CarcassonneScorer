# Check Report — Item 015
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-21
- Attempt: 1

## Commands run
- `npm run lint` → exit 0 — eslint + prettier clean.
- `npm run build` → exit 0 — `tsc -p packages/core/tsconfig.json --noEmit` then `tsc -p packages/web/tsconfig.json --noEmit && vite build`, both succeed (`dist/` produced, 69 modules transformed).
- `npm test` → exit 0 — 15 test files / 310 tests passed: 12 core suites (`engine`, `city-road-scoring`, `catalog-consistency` (30), `scenarios`, `feature-extraction`, `catalog` (71), `base-game-catalog` (54), `smoke`, `ownership`, `meeple-colours`, `session`, `board-state`) + 3 web suites (`state.test.tsx` 7, `App.test.tsx` 6, `setup.test.tsx` 10).

## Acceptance criteria (from the spec)
- [x] Setup view in `packages/web/src/setup/` renders when no game is in progress, 2–6 players, add disabled at 6 / remove disabled at 2 — `packages/web/src/setup/SetupView.tsx:52-53` (`canAdd`/`canRemove` from `MIN_PLAYERS`/`MAX_PLAYERS`); `packages/web/test/setup.test.tsx:60-96` ("renders 2 player rows by default", "add player grows up to 6... disables", "remove player shrinks down to 2... disables"); routing confirmed in `packages/web/test/App.test.tsx:23-26`.
- [x] Per-player name + colour picker sourced from `meepleColours`: `packages/web/src/setup/PlayerRow.tsx:30-42` (labelled name `<input>` + `ColourPicker`); `packages/web/src/setup/ColourPicker.tsx:1,32` imports and maps `meepleColours` directly (no local colour list). Test: `packages/web/test/setup.test.tsx:117-124`.
- [x] Each colour option shows a non-colour cue (name/label + pattern), not hue alone — `packages/web/src/setup/ColourPicker.tsx:39` renders `"{name} ({pattern})"` as visible `<option>` text (swatch hue is only a `style.color` hint, never the sole signal, line 37); verified by `packages/web/test/setup.test.tsx:117-124` asserting the text for every colour.
- [x] Chosen colours kept distinct (duplicates disabled/prevented; unique colourIds in session) — `packages/web/src/setup/ColourPicker.tsx:36` disables an `<option>` already taken by another row; `packages/web/src/setup/SetupView.tsx:55-57` computes `takenByOthers`; test `packages/web/test/setup.test.tsx:126-135` ("prevents selecting a colour already taken... disabled option") and `:137-155` ("created session always has unique colourIds across players", exercised at 6 players).
- [x] "Start game" produces a `GameSession` via `startGame`→`createSession` and routes to in-game view — `packages/web/src/setup/SetupView.tsx:90-91` calls `startGame(players)`; `packages/web/src/App.tsx:55-58` (`GameShell`) routes on `session` state; test `packages/web/test/setup.test.tsx:157-168` and `packages/web/test/App.test.tsx:28-39`.
- [x] Empty name → "Player N" — `packages/web/src/setup/SetupView.tsx:34-37` (`resolveName`); test `packages/web/test/setup.test.tsx:104-115`.
- [x] `SessionError` surfaced inline, no crash — `packages/web/src/setup/SetupView.tsx:90-98` catches and sets `error` (testid `setup-error`); test `packages/web/test/setup.test.tsx:170-186` forces a duplicate-colour `SessionError` via a direct `fireEvent.change` bypass and asserts the inline message and that the view stays on setup (no crash).
- [x] Component tests cover all the listed scenarios — confirmed all 10 cases present in `packages/web/test/setup.test.tsx` (default rows, add/remove bounds, naming, accessibility cue, duplicate-colour prevention, unique colourIds, submit/route, error backstop).
- [x] `npm run lint && npm run build && npm test` exits 0; Items 001–014 remain green; core no-DOM boundary intact; no scoring/tally arithmetic in the UI — see Commands run above; `packages/core/tsconfig.json:5` restricts `lib` to `["ES2022"]` (no DOM types) and the core build/type-check passed; `packages/core/src` has zero `react`/DOM/`window`/`document` references (grep verified); `packages/web/src/setup/**` and `packages/web/src/App.tsx` contain no score/tally/points computation (grep verified) — `App.tsx`'s `PlayView` placeholder (totals/addScore) predates this item (Item 014) and is unchanged in substance.
- [x] 2–6 bound reuses the core's exported constant, not a fresh magic number — `packages/web/src/setup/SetupView.tsx:3` imports `MAX_PLAYERS, MIN_PLAYERS` from `@carcassonne/core` (defined at `packages/core/src/session/session.ts:24,27`) and uses them at lines 26, 52-53 with no hard-coded `2`/`6` bound logic.

## Scope boundary verification
- Setup-only: no scoreboard/score-entry/log/persistence code found under `packages/web/src/setup/`; `PlayView` in `App.tsx` remains the Item 014 placeholder, untouched except import/removal of the old setup placeholder.
- Core unchanged for this item; no-DOM boundary intact (verified via `tsconfig.json` lib restriction + grep for DOM/React imports in `packages/core/src`).
- Catalog/colours remain sourced solely from `@carcassonne/core`'s `meepleColours` — no duplicate colour list introduced in the web package.
- All prior suites (Items 001–014, i.e. 12 core test files + `state.test.tsx`/updated `App.test.tsx`) pass alongside the new `setup.test.tsx`.

## Notes
- The `SessionError` backstop test deliberately bypasses the UI's own prevention via a direct `fireEvent.change` on a disabled `<option>`'s value (documented inline in the test and in the implementation report) since jsdom does not enforce the `disabled` attribute on programmatic value changes. This is a reasonable way to exercise an otherwise-unreachable code path and does not weaken the criterion — the resulting assertion (inline error text, view stays on setup) is the correct backstop behaviour.
