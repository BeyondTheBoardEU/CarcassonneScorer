# Item 014 — App state store and game-shell lifecycle

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-21

---

## Description

Introduce the web app's **state container and shell**: a store that holds the current `GameSession` (Item 012), exposes each player's **derived totals via the core `computeTotals` reducer**, and dispatches score events; plus a **shell** that routes between the **setup** view (no game in progress) and the **in-game** view (a game in progress). This is the single seam every subsequent Stage 2 UI item (015–018) binds to and that persistence (Item 019) hooks into.

The discipline here: **no scoring/tally arithmetic in the store or components** — the store delegates every total to the core `computeTotals` and every mutation to the core `createSession`/`addScoreEvent`. The store owns only the *impure* boundary the core deliberately left to callers: generating event ids and timestamps when dispatching.

### Scope boundary

- **Store + shell + routing only.** The actual setup form is Item 015, scoreboard Item 016, score entry Item 017, log Item 018. This item provides the provider/hook + routing and **minimal placeholder views** with clear seams those items replace.
- **No persistence.** Loading/saving to local storage is Item 019; the store just exposes a clean state shape and a hydrate seam for it. Initial state is "no game" unless seeded in tests.
- **No tally maths in the UI layer.** Totals come exclusively from `computeTotals`; the store/components never sum deltas themselves.
- **Lightweight, no new state library.** Use React's built-in `useReducer` + Context — do **not** add Redux/Zustand/etc. (keep the dependency surface minimal for a thin UI).

## Design decisions (decided here)

- **Location.** New UI module under `packages/web/src/` (e.g. `state/` — `GameProvider.tsx`, a `useGame()` hook, a `reducer.ts`), plus the shell wiring in `App.tsx`. Follow the established `.tsx` + `.js`-extension import + explicit-return-type conventions already in the package.
- **State shape.** `{ session: GameSession | null }` — `null` means "no game in progress" (→ setup view); a `GameSession` means in-game (→ play view). Keeping the whole session (Item 012 shape) is what makes persistence (019) trivial.
- **React `useReducer` + Context.** A `gameReducer(state, action)` handles actions; a `GameProvider` supplies state + a small typed API via context; a `useGame()` hook returns `{ session, totals, startGame, addScore, newGame }` (names may vary).
  - `startGame(players)` → `createSession(players)` (Item 012; surfaces `SessionError` for invalid setups so Item 015 can show it) and sets `session`.
  - `addScore(playerId, delta, reason?)` → `addScoreEvent(session, { playerId, delta, reason, timestamp: Date.now(), id })` — the store supplies `timestamp` (and a unique `id`) at this impure boundary, keeping the core pure.
  - `newGame()` (a.k.a. end/reset) → `session = null`, returning to setup. (Full lifecycle — resume/finalise — is Stage 3; Stage 2 needs at least "start a game" and "start over".)
- **Derived totals via the core.** `totals` is computed by calling `computeTotals(session)` (memoised with `useMemo` over `session`), never by summing in the component. When `session` is `null`, `totals` is empty.
- **Hydrate seam for persistence.** The provider accepts an optional `initialSession` (or an injectable initial state) so Item 019 can hydrate a persisted game and tests can seed an in-game state. Default is `null`.
- **Shell routing.** `App` renders the **setup** placeholder when `session === null` and the **play** placeholder (which later composes scoreboard + entry + log) when a session exists — driven purely by store state, no router dependency needed for two views.
- **Error surfacing.** `startGame` failures (`SessionError`) are exposed to the caller (return/throw or an error field) so Item 015's form can render validation messages rather than crashing.

## Proposed shape (not final names)

```tsx
interface GameState { session: GameSession | null; }
type GameAction =
  | { type: "start"; players: Player[] }
  | { type: "addScore"; playerId: string; delta: number; reason?: string; id: string; timestamp: number }
  | { type: "newGame" };

function gameReducer(state: GameState, action: GameAction): GameState; // delegates to core create/add

interface GameApi {
  session: GameSession | null;
  totals: Record<string, number>;        // from computeTotals(session)
  startGame(players: Player[]): void;     // may surface SessionError
  addScore(playerId: string, delta: number, reason?: string): void;
  newGame(): void;
}
function useGame(): GameApi;
function GameProvider(props: { initialSession?: GameSession | null; children: ReactNode }): JSX.Element;
```

## Acceptance criteria

- [x] A `GameProvider` + `useGame()` (React Context + `useReducer`) live in `packages/web/src`, holding `{ session }` and exposing `totals`, `startGame`, `addScore`, `newGame` (names may vary). No new state-management dependency added.
- [x] **Totals come from the core:** `totals` is produced by `computeTotals(session)` (Item 012), not by any summation in the store or components. With no game, `totals` is empty.
- [x] **Mutations delegate to the core:** `startGame` uses `createSession`, `addScore` uses `addScoreEvent`; the store supplies `timestamp`/`id` at dispatch (the core stays pure). A `SessionError` from `createSession` is surfaced to the caller (not swallowed/crashing).
- [x] **Shell routing:** `App` shows the setup view when `session === null` and the in-game view when a session exists; `startGame` flips setup→play and `newGame` flips play→setup.
- [x] A **hydrate seam** exists (`initialSession` prop or equivalent) so a persisted/seeded session renders straight into the in-game view (used by Item 019 and tests).
- [x] Component/unit tests (RTL) verify: starting a game transitions to the play view; `addScore` updates the derived total immediately; `newGame` returns to setup; an invalid `startGame` surfaces the error.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–013, incl. the web smoke test) remain green; core's no-DOM boundary intact.

> Maps to the Stage 2 deliverable "thin UI over core, single source of game state." It begins satisfying "No scoring arithmetic in the UI — totals come from the core" (fully demonstrated once the scoreboard/entry land, Items 016/017). No user-facing acceptance criterion is fully ticked by this item alone.

## Implementation steps

1. Read `packages/web/src/App.tsx` and `packages/web/test/App.test.tsx` for conventions; review `@carcassonne/core` exports `createSession`, `addScoreEvent`, `computeTotals`, `Player`, `GameSession`, `SessionError`.
2. Add `packages/web/src/state/` : `reducer.ts` (`gameReducer` delegating to core), `GameProvider.tsx` (+ context), `useGame.ts` hook.
3. Update `App.tsx` to wrap content in `GameProvider` and route between a `SetupView` placeholder (session null) and a `PlayView` placeholder (session present). Keep placeholders minimal with clear "replaced by Item 015/016/017/018" notes.
4. Generate event ids/timestamps in `addScore` (e.g. `crypto.randomUUID?.()` with a fallback, or a counter + `Date.now()`); keep this the only impure spot.
5. Add tests (see strategy) and run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Component/hook tests (Vitest + @testing-library/react + jsdom)** in `packages/web/test/`:
  - Render `GameProvider` + a small harness using `useGame` (or the shell): initially the **setup** view shows; after `startGame([2 players])`, the **play** view shows.
  - `addScore(p1, 5)` then `addScore(p1, 3)` → that player's `totals` shows `8` (proves delegation to `computeTotals`); a negative delta reduces it.
  - `newGame()` returns to the setup view and clears `totals`.
  - Invalid `startGame` (e.g. 1 player) surfaces a `SessionError` (asserted via the exposed error path), not a crash.
  - `initialSession` seeds straight into the play view.
- **Regression:** existing web smoke test (Item 011) and all core suites stay green.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 011 (web scaffold, test runner), Item 012 (`createSession`/`addScoreEvent`/`computeTotals`/`Player`/`GameSession`/`SessionError`).
- **Downstream:** Item 015 (setup view calls `startGame`), Item 016 (scoreboard reads `totals`/`session`), Item 017 (score entry calls `addScore`), Item 018 (log reads `session.events`), Item 019 (persistence hydrates via the seam + subscribes to `session`).

## Testing Prerequisites

**Required Services**
- None. Local web tooling only.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars/secrets/services. (Deps from Item 011 already installed.)

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (state/shell tests green; Items 001–013 + web smoke still green)
- [x] Services started — N/A
- [x] Application runs — `npm run dev`: app shows the setup placeholder; starting a game shows the play placeholder (manual)
- [x] Feature verified — store delegates totals to core; routing flips on start/newGame
- [x] Data verified — `addScore` updates derived totals via `computeTotals`
- [x] Health checks pass — N/A

**Expected Outcomes**
- A `GameProvider`/`useGame` store + routed shell with totals from the core; `npm run lint && npm run build && npm test` exits 0; prior suites + core boundary intact.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: `npm run dev` (manual)
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: optional (setup vs play placeholder)

## Decisions & Trade-offs

- **Context + `useReducer`, no new dependency.** `GameProvider`/`useGame()` were built with React's built-in `useReducer` and Context, as the spec required; `packages/web/package.json` lists only `@carcassonne/core`, `react`, `react-dom` as runtime deps — no Redux/Zustand/etc. was added.
- **The reducer never calls the core directly; the provider does, before dispatching.** An initial version had `gameReducer` itself call `createSession`/`addScoreEvent` (closer to the spec's illustrative `"start"`/`"addScore"` action sketch), but React runs reducers during the render phase, so a thrown `SessionError` from inside the reducer becomes an *uncaught* render error rather than a normal exception at the `dispatch()`/`startGame()` call site — it could not be caught by a caller's `try/catch`. The fix: `startGame`/`addScore` call the core's `createSession`/`addScoreEvent` themselves (outside the reducer) and dispatch only a pre-built result via a single `{ type: "setSession", session }` action (plus `{ type: "newGame" }`). The reducer is now two trivial cases with zero core calls and zero arithmetic, which strengthens rather than weakens "no scoring/tally maths in the store." Action/type names therefore differ from the spec's illustrative sketch, which the spec explicitly permits ("names may vary"); the public `GameApi` shape (`session`/`totals`/`startGame`/`addScore`/`newGame`) matches the spec exactly.
- **The store supplies `id`/`timestamp` at the `addScore` dispatch boundary.** `addScoreEvent` is called with `timestamp: Date.now()` and a generated `id` (`crypto.randomUUID()` with a manual fallback for environments without it) — the only impure operation in the store, keeping the core pure as the spec requires.
- **`SessionError` surfaced synchronously to the caller.** Because `createSession` runs inside `startGame` itself (not inside the reducer), a caller's `try { startGame(players) } catch (e) { ... }` catches `SessionError` normally; `App.tsx`'s `SetupView` and the test harness both use this to render a validation message instead of crashing.
- **`GameContext` split into its own `context.ts` module.** Rather than co-locating the context object inside `GameProvider.tsx`, it lives in a separate non-component module so `GameProvider.tsx` exports only the component (+ its props type) — satisfying the repo's `react-refresh/only-export-components` ESLint rule, which otherwise warns when a `.tsx` file exports both a component and a non-component value.
- **Hydrate seam via `initialSession`.** Both `GameProvider` and `App` accept an optional `initialSession` prop, threaded into `createInitialState`, so a persisted or test-seeded `GameSession` renders straight into the play view with no extra `startGame` call — this is the seam Item 019 (persistence) and the component tests both use.
- **`addScore` is a no-op (not a throw) when `session` is null.** Calling it with no game in progress is a programmer error the Stage 2 UI (Items 015–018) should never trigger by exposing the control without a session, so it is silently ignored rather than throwing — consistent with the spec's framing that only `startGame`'s `SessionError` needs to be surfaced.
- **`@testing-library/user-event` was not added.** Only `@testing-library/react`/`jest-dom` were already present as devDependencies; new tests use `fireEvent.click` instead, keeping the "no new dependency" constraint intact.
- **Placeholder views kept minimal and inline in `App.tsx`** rather than split into a separate `views/` folder, since this item scopes to store + shell + routing + placeholders; `SetupView`/`PlayView` are each commented with the exact items (015–018) that will replace their bodies.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 014 against the Stage 2 deliverable "thin UI over core / single source of game state." **Stage 2 stays 🚧 In Progress.** Do not tick user-facing Stage 2 acceptance criteria yet (they need the setup/scoreboard/entry/log/persistence UI). Stage 1 stays ✅. Update only Item 014's progress. Status flow: 📋 → 🚧 → ✅.
