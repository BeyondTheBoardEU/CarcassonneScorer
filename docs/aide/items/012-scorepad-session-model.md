# Item 012 — Scorepad session model and tally reducer

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-21

---

## Description

Define the **manual-scorepad domain** as platform-independent data + logic in `packages/core`: a `Player`, a `ScoreEvent`, and a `GameSession` (players + an ordered event log + a schema version), plus a **pure tally reducer** that derives each player's running total from the event log. Include constructors for starting a session and appending events, all **JSON-serializable** for the Item 019 persistence cut.

This is the "**totals come from the core**" engine for manual entry. The Stage 2 acceptance criterion "No scoring arithmetic lives in the UI — totals come from the core" is satisfied by putting all summation here, in a pure module the UI merely calls. It is the data contract the app state store (Item 014), scoreboard (016), score entry (017), event log (018), and persistence (019) all bind to.

Note: this is **manual** scoring — points are explicit deltas a user enters, **not** derived from a board via `scoreBoard`. It is independent of the board/catalog/scoring-engine modules (Items 002–010); do not couple them.

### Scope boundary

- **No UI.** Pure data + functions in `packages/core`; no DOM, no React, no storage. (Persistence is Item 019; UI is 014–018.)
- **No board/scoring-engine coupling.** This is manual point entry. Do **not** import the catalog, board, or `scoreBoard` here, and do not reconcile manual scores against board state. (The board-derived engine and the manual scorepad are separate concerns in Stage 2.)
- **No edit/reverse semantics.** Stage 2's log is **append-only**; editing or reversing past events is **Stage 3**. Provide append + tally only. (A reversal in Stage 3 will itself be modelled as a new event or an explicit edit then.)
- **No game roster beyond players.** Player identity = id + name + colour id; meeple-colour *data* is Item 013 (this model references a colour by opaque `colourId: string`, mirroring how the board model references tiles by opaque id).

## Design decisions (decided here)

- **Location.** New module `packages/core/src/session/` (e.g. `{types,session,tally,errors,index}.ts`), re-exported from `packages/core/src/index.ts`. Platform-independent (inherits the core's no-DOM boundary).
- **Plain JSON shapes; `version` field.** Mirror the Item 002 board-state conventions: plain serializable objects, no classes/`Map`/`Set`/`Date` in the stored shape, and a top-level `version` (`SESSION_VERSION` constant) for forward-compatible deserialization (Item 019).
- **Types.**
  - `Player { id: string; name: string; colourId: string }` — `colourId` is an opaque reference to the Item 013 colour set (not validated here).
  - `ScoreEvent { id: string; playerId: string; delta: number; timestamp: number; reason?: string }` — `delta` is the signed point change (negative allowed for corrections); `timestamp` is epoch-ms **number** (no `Date` in the stored shape).
  - `GameSession { version: number; players: Player[]; events: ScoreEvent[] }` — `events` is the append-ordered log.
- **Purity / determinism.** Core functions do **not** call `Date.now()` or generate randomness internally (that would be impure and hard to test). The **caller supplies** `timestamp` (and `id` if it wants a specific one) when appending; the constructor may derive a deterministic fallback id (e.g. from event count) but must accept an injected id/timestamp so tests are deterministic. Document this.
- **Immutable updates.** `addScoreEvent` returns a **new** `GameSession` (does not mutate its input), consistent with a reducer-style store (Item 014).
- **Pure tally reducer.** `computeTotals(session): Record<string, number>` returns each player's summed `delta`. Every player in `players` appears in the result (players with no events → `0`), so the scoreboard (Item 016) can render all players without defaulting. Events referencing an unknown `playerId` are ignored by the tally (or rejected at append — see guards).
- **Structural guards (model-level, not game rules).** Constructors reject obviously invalid input with a clear typed error (`SessionError` with a discriminated `kind`, mirroring `BoardStateError`): a session with **fewer than 2 or more than 6 players** (Stage 2 player-count rule), **duplicate player ids**, **duplicate colour ids** (colours must be distinct per the setup criterion), and appending an event for a **playerId not in the session**. Validation of the *value* of a colour id against the Item 013 set is out of scope (opaque ref).
- **Player-count bounds live here.** The 2–6 bound is encoded in this model (single source of truth) so the setup UI (Item 015) enforces the same rule it does, not a duplicated constant.

## Proposed types (shape, not final names)

```ts
const SESSION_VERSION = 1;

interface Player { id: string; name: string; colourId: string; }
interface ScoreEvent { id: string; playerId: string; delta: number; timestamp: number; reason?: string; }
interface GameSession { version: number; players: Player[]; events: ScoreEvent[]; }

// construction (immutable; caller supplies ids/timestamps for determinism)
function createSession(players: Player[]): GameSession;                 // validates count/dupes
function addScoreEvent(session: GameSession, event: Omit<ScoreEvent,"id"> & { id?: string }): GameSession;

// derivation
function computeTotals(session: GameSession): Record<string, number>;   // playerId -> total (all players present)

// errors
class SessionError extends Error { kind: "player-count" | "duplicate-player-id" | "duplicate-colour" | "unknown-player"; }
```

Exact names/layout may vary; serialization itself (stringify/parse + validate) is Item 019, but the shapes here must be JSON-round-trippable.

## Acceptance criteria

- [x] `Player`, `ScoreEvent`, `GameSession`, `SESSION_VERSION`, `createSession`, `addScoreEvent`, `computeTotals`, and `SessionError` are implemented in `packages/core/src/session/` and **exported from `@carcassonne/core`**. Pure; no DOM/storage; no board/catalog import.
- [x] `createSession` produces a valid `GameSession` with `version === SESSION_VERSION`, the given players, and an empty event log; it **rejects** <2 or >6 players, duplicate player ids, and duplicate colour ids with a typed `SessionError`.
- [x] `addScoreEvent` returns a **new** session with the event appended (input unmutated); it rejects an event whose `playerId` is not in the session. Positive and negative `delta`s are accepted. Caller-supplied `id`/`timestamp` are honoured; an omitted `id` is filled deterministically.
- [x] `computeTotals` returns each player's summed `delta`, with **every** player present (no-event players → `0`); the result reflects positive and negative adjustments correctly.
- [x] All shapes are JSON-serializable: `JSON.parse(JSON.stringify(session))` is deep-equal to `session` (no `Date`/`Map`/`Set` in the shape) — asserted by a round-trip test (the validated deserializer is Item 019).
- [x] The 2–6 player bound is defined once in this module and reused (no duplicated magic numbers elsewhere planned).
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–011) remain green; no new cyclic import; core's no-DOM boundary intact.

> Maps to the Stage 2 deliverable "score model behind setup/scoreboard/log" and is the engine for the acceptance criterion "No scoring arithmetic in the UI — totals come from the core." It does not by itself satisfy a user-facing Stage 2 acceptance criterion (those need the UI items).

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/012/`.

## Implementation steps

1. Read `packages/core/src/board/{types,errors,builder}.ts` to mirror the Item 002 conventions (`version` constant, `*Error` with discriminated `kind`, immutable construction, no `Date` in stored shape).
2. Add `packages/core/src/session/types.ts` (the three shapes + `SESSION_VERSION`) and `errors.ts` (`SessionError`).
3. Add `session.ts` (`createSession`, `addScoreEvent` with guards) and `tally.ts` (`computeTotals`). Pure, immutable.
4. Re-export from `session/index.ts` and `packages/core/src/index.ts`.
5. Add `packages/core/test/session.test.ts` (see strategy).
6. Run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** (node project) in `packages/core/test/session.test.ts`:
  - **Construction:** `createSession` with 2 and 6 players succeeds; 1 player and 7 players throw `SessionError("player-count")`; duplicate player id throws `duplicate-player-id`; duplicate colour id throws `duplicate-colour`.
  - **Append:** `addScoreEvent` appends, returns a new object (original unchanged — assert reference inequality and original length); unknown `playerId` throws `unknown-player`; negative delta accepted; omitted id filled deterministically; supplied id/timestamp honoured.
  - **Tally:** `computeTotals` over a sequence of mixed positive/negative events gives correct per-player totals; a player with no events is present with `0`; multiple events for one player sum.
  - **Serialization round-trip:** `JSON.parse(JSON.stringify(session))` deep-equals `session` for a non-trivial session (≥2 players, several events incl. a `reason`).
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 001 (core scaffold, test runner), Item 002 conventions (mirror, not import). Independent of the catalog/board/scoring modules.
- **Downstream:** Item 013 (colour set — `colourId` resolves against it), Item 014 (state store wraps this reducer), Items 015–018 (UI binds to these shapes/totals), Item 019 (serializes/deserializes `GameSession`). This is the data spine of Stage 2.

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (session suite green; Items 001–011 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — session types + `createSession`/`addScoreEvent`/`computeTotals` exported from `@carcassonne/core`; guards and tally behave per criteria
- [x] Data verified — totals correct incl. negatives & no-event players; JSON round-trip deep-equal
- [x] Health checks pass — N/A

**Expected Outcomes**
- Platform-independent session model + pure tally reducer exported from core; `npm run lint && npm run build && npm test` exits 0; prior suites and core boundary intact.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: N/A
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [x] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

- **Exposed `MIN_PLAYERS`/`MAX_PLAYERS` as named exports** (2/6) alongside `SESSION_VERSION`, rather than inlining the bound only inside `createSession`. This satisfies "the 2–6 bound is defined once in this module and reused" and lets the setup UI (Item 015) import the same constants instead of duplicating magic numbers.
- **Deterministic fallback id format is `event-<n>`**, where `n` is the session's event count at append time (e.g. the first appended event is `"event-0"`). This is stable and collision-free for a single append-only log and is documented in `session.ts`. Trade-off: ids are only unique within a single session's log, not globally, which is acceptable since events are always addressed relative to their session.
- **`addScoreEvent`'s input type is `Omit<ScoreEvent, "id"> & { id?: string }`**, matching the spec's proposed types exactly. The optional `reason` field is included in the constructed event object only when defined (never written as `reason: undefined`), which keeps `JSON.parse(JSON.stringify(session))` deep-equal to the original session — an explicit `undefined` property would otherwise survive in the in-memory object but vanish on serialization, breaking the round-trip equality criterion.
- **`computeTotals` ignores (rather than throws on) events with an unknown `playerId`**, per the spec's explicit fallback wording ("ignored by the tally (or rejected at append — see guards)"). The actual gate is `addScoreEvent`, which already rejects such events before they can enter the log; making the reducer defensive as well costs nothing and keeps it robust against future session shapes that might not go through the constructor.
- **No catalog/board/scoreBoard import anywhere in `packages/core/src/session/`** — confirmed via the build (no cyclic import introduced) and via grep showing the module's only imports are its own internal `./types.js`/`./errors.js`. This preserves the spec's scope boundary keeping manual scoring independent of the board-derived scoring engine (Items 002–010).

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 012 against the Stage 2 deliverable "score model / totals from the core" (the manual-scorepad domain + tally reducer). **Stage 2 stays 🚧 In Progress.** Do not tick user-facing Stage 2 acceptance criteria yet (they need the UI items 015–019); the "no scoring arithmetic in the UI" criterion is *enabled* here but is ticked once the UI demonstrably consumes this reducer (Item 016/020). Stage 1 stays ✅. Update only Item 012's progress. Status flow: 📋 → 🚧 → ✅.
