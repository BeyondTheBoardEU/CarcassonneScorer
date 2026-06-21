# Check Report — Item 014
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-21
- Attempt: 1

## Commands run
- `npm run lint` → exit 0 (eslint + prettier --check, no errors)
- `npm run build` → exit 0 (core `tsc --noEmit`, then web `tsc --noEmit && vite build`; bundle emitted to `packages/web/dist`)
- `npm test` → exit 0 — **14 test files / 301 tests passed** (12 core test files, 2 web test files: `state.test.tsx` 7 tests, `App.test.tsx` 7 tests)

## Acceptance criteria (from the spec)
- [x] `GameProvider` + `useGame()` (Context + `useReducer`) live in `packages/web/src/state/`, holding `{ session }` and exposing `totals`/`startGame`/`addScore`/`newGame`. No new state-management dependency: `packages/web/package.json:11-15` lists only `@carcassonne/core`, `react`, `react-dom` (deps) and testing/build tooling (devDeps) — no Redux/Zustand/etc. — `packages/web/src/state/GameProvider.tsx:1,32-79` uses `useReducer`/`useMemo`/`useCallback` from React only.
- [x] **Totals from the core:** `packages/web/src/state/GameProvider.tsx:36-39` — `totals = useMemo(() => state.session ? computeTotals(state.session) : {}, [state.session])`. Confirmed no manual summation anywhere in `packages/web/src` (`grep -E "reduce\(|\+=|delta \+|sum\("` → no matches). Empty-state test: `packages/web/test/state.test.tsx:70-74` (`harness-total-p1` → `"none"` when no game).
- [x] **Mutations delegate to the core:** `startGame` → `createSession(players)` at `GameProvider.tsx:47`; `addScore` → `addScoreEvent(state.session, { playerId, delta, timestamp: Date.now(), id: generateEventId(), ... })` at `GameProvider.tsx:58-64`, with `id`/`timestamp` supplied by the store (`generateEventId()` at `GameProvider.tsx:10-15`, `crypto.randomUUID()` with fallback). `SessionError` surfaced: `createSession` is called synchronously inside `startGame` (outside the reducer) so it throws to the caller; `App.tsx:19-26` and the test harness (`state.test.tsx:21-28`) catch it via `try/catch` and render the message/kind instead of crashing — verified by `state.test.tsx:114-121` (`harness-error` → `"player-count"`, still in setup) and `App.test.tsx:48-56` (`setup-error` matches `/player/i`, `setup-view` still present).
- [x] **Shell routing:** `App.tsx:105-108` (`GameShell`) renders `PlayView` iff `session` truthy, else `SetupView`, driven purely by `useGame().session`. `startGame` flips setup→play (`App.test.tsx:28-35`); `newGame` flips play→setup (`App.test.tsx:37-46`).
- [x] **Hydrate seam:** `GameProviderProps.initialSession` (`GameProvider.tsx:17-25`) threaded through `App`'s `AppProps.initialSession` (`App.tsx:110-113,123-134`) into `createInitialState` (`reducer.ts:36-38`). Verified renders straight into play: `App.test.tsx:58-70` and `state.test.tsx:123-134` (seeded session with one prior event → total `4` immediately, no `startGame` call needed).
- [x] **Tests cover the required scenarios:** start→play (`state.test.tsx:76-80`, `App.test.tsx:28-35`); `addScore` updates total immediately, `+5` then `+3` → `8` (`state.test.tsx:82-91`), negative delta reduces (`6` after `-2`, `state.test.tsx:93-101`); `newGame`→setup (`state.test.tsx:103-112`, `App.test.tsx:37-46`); invalid `startGame` (1 player) surfaces error without crash (`state.test.tsx:114-121`, `App.test.tsx:48-56`); `initialSession` seeds play (`state.test.tsx:123-134`, `App.test.tsx:58-70`).
- [x] `npm run lint && npm run build && npm test` exits 0 for all three; all 12 prior core test files plus the Item 011 web smoke assertions (`App.test.tsx:11-21`, heading + `core-status`) remain green; core's no-DOM boundary intact — `packages/core/src` has no `document`/`window`/`HTMLElement`/`localStorage` runtime usage (only a stale doc-comment mentioning "localStorage" in `serialize.ts:4`, pre-existing from Item 002, unrelated to this item and not an actual import).

## Scope boundary verification
- No persistence/localStorage in new code: `grep -r "localStorage|sessionStorage" packages/web/src` → no matches.
- No real setup/scoreboard/entry/log forms: `SetupView`/`PlayView` in `App.tsx:15-98` are explicitly commented placeholders ("Placeholder — replaced by Item 015/016/017/018").
- Git diff confined to: `packages/web/src/App.tsx`, `packages/web/test/App.test.tsx` (both modified), plus new `packages/web/src/state/**` and `packages/web/test/state.test.tsx`. No core source files touched (`git diff --stat HEAD` shows no `packages/core` entries).
- Items 001–013 regression: all 12 core test files pass (285 core tests) alongside the 2 web test files (16 web tests) = 301 total, matching the report's claimed count.

## Notes
- The implementer deviated from the spec's illustrative action shape (`"start"`/`"addScore"` actions inside the reducer) by moving the core calls (`createSession`/`addScoreEvent`) out of the reducer and into `startGame`/`addScore` themselves, dispatching only a pre-built `{ type: "setSession", session }`. This is a sound, well-justified deviation — the spec explicitly allows names/shapes to vary, and the rationale (React reducers run during the render phase, so a thrown `SessionError` from inside a reducer becomes an uncaught render error rather than a catchable exception at the call site) is correct and verified by the passing error-surfacing tests. The public `GameApi` shape matches the spec exactly.
- `@testing-library/user-event` was not added; tests use `fireEvent` from the already-installed `@testing-library/react`, consistent with the "no new dependency" constraint.
