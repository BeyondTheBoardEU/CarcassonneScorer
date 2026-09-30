<!-- aide-template: item 2 -->
# Item 019 — Local persistence (first cut)

> **Created:** 2026-06-23 · status tracked in [`progress.md`](../progress.md)
> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [`../queue/queue-002.md`](../queue/queue-002.md) · Item 019
> **Objectives:** G3 (first cut), G1
> **Suggested branch:** `aide/019-local-persistence`

---

## Description

Persist the in-progress game so a **reload restores it**: serialize the `GameSession` (players, event log — and thus the derived totals) to local storage on change, and rehydrate it into the Item 014 store on app startup via the existing hydrate seam. Two parts:

1. **Core (platform-independent):** a validated `serializeSession` / `deserializeSession` pair (the deserializer the Item 012 spec explicitly deferred to here), mirroring the Item 002 `serializeBoard`/`deserializeBoard` pattern — version-checked, throwing a typed `SessionError` on malformed input.
2. **Web:** a small storage abstraction (interface + a `localStorage` implementation) plus store wiring that saves on session change and loads at startup.

This delivers the Stage 2 "local persistence (first cut)" deliverable and the acceptance criterion "Reloading restores the exact in-progress game (players, totals, log)."

### Scope boundary

- **First cut only.** This is the *reload-restores-it* cut. **Crash/abrupt-close/device-sleep durability, atomic writes, corruption hardening, and PWA/offline** are **Stage 3** — out of scope. Reasonable graceful handling of absent/corrupt/version-mismatched data is in scope (don't crash), but full durability hardening is not.
- **No review/correction or lifecycle beyond restore.** Editing the log, finalising/resuming multiple games, etc. are Stage 3. Item 019 persists the single current session and restores it; `newGame` clears it.
- **One session, one key.** Persist the single in-progress `GameSession` under a fixed storage key. Multi-game history is Stage 3.

### Design decisions (decided here)

- **Core serialize/deserialize (mirror the board pattern).**
  - `serializeSession(session: GameSession): string` — `JSON.stringify` of the plain shape (Item 012 already guarantees JSON-round-trippability).
  - `deserializeSession(json: string): GameSession` — parse + **validate shape** (players/events arrays, required fields, valid `delta`/`timestamp` types) + **check `version === SESSION_VERSION`**; throw `SessionError` with a `kind` (e.g. `"malformed-input"`/extend the union, and a version-mismatch case) — **never** return a partial/invalid session. Mirrors `deserializeBoard`'s strict-version behaviour (Item 002 decisions).
  - Add these to `packages/core/src/session/` and export from `@carcassonne/core`. Pure; no DOM.
- **Web storage abstraction.** A tiny interface (e.g. `SessionStorage { load(): GameSession | null; save(session): void; clear(): void }`) with a `localStorage`-backed implementation under `packages/web/src/persistence/`. The interface keeps it testable (inject a fake) and swappable (Stage 3 may move to IndexedDB).
  - `save` writes `serializeSession(session)` under a fixed key (e.g. `"carcassonne.session.v1"`).
  - `load` reads the key; **absent/blank → `null`** (clean start); on `deserializeSession` throwing (corrupt or version mismatch) → treat as no game (return `null`, optionally `clear()` the bad key) — **never throw to the app**.
- **Store wiring.**
  - **Startup hydrate:** read `storage.load()` and feed it into the Item 014 provider via the `initialSession` seam (e.g. `App` constructs the provider with `initialSession={storage.load()}`).
  - **Persist on change:** subscribe to session changes (e.g. a `useEffect` in the provider or an effect over `session`) and call `storage.save(session)` when there is a session, and `storage.clear()` on `newGame()` (session → null). Keep this the only place persistence touches the store.
- **SSR/availability guard.** Guard `localStorage` access (it exists in the browser and jsdom; guard defensively so a missing storage can't crash startup).

### Proposed shapes (not final names)

```ts
// core
function serializeSession(session: GameSession): string;
function deserializeSession(json: string): GameSession;   // throws SessionError on malformed/version-mismatch

// web
interface SessionStorage {
  load(): GameSession | null;     // null when absent/corrupt/version-mismatch (never throws)
  save(session: GameSession): void;
  clear(): void;
}
function createLocalSessionStorage(key?: string): SessionStorage;  // localStorage-backed
```

## Acceptance Criteria

- [ ] **AC1: Core round-trip.** `serializeSession` / `deserializeSession` are implemented in `packages/core/src/session/` and exported from `@carcassonne/core`; `serialize → deserialize` round-trips to a deep-equal session.
- [ ] **AC2: Core strict validation.** `deserializeSession` validates shape + `version` and throws a typed `SessionError` on malformed or version-mismatched input (never returns a partial session).
- [ ] **AC3: Storage abstraction.** A `SessionStorage` abstraction + a `localStorage` implementation exist in `packages/web/src/persistence/`; `save` writes the serialized session under a fixed key; `load` returns the restored session.
- [ ] **AC4: Storage never throws.** `load` returns `null` when storage is absent/blank/corrupt/version-mismatched — without throwing to the app — and a bad key is cleared so it cannot poison future loads.
- [ ] **AC5: Startup hydrate.** On load, a previously saved session is rehydrated into the store via the Item 014 `initialSession` seam, so the app opens straight into the in-game view with the restored players, event log, and (recomputed) totals.
- [ ] **AC6: Persist on change.** Adding/adjusting scores (Item 017) updates the saved session.
- [ ] **AC7: New game clears.** `newGame` clears the saved session so a reload then starts at setup.
- [ ] **AC8: Reload restores the exact game.** A simulated reload (re-mount reading the same storage) yields the same players, the same event log, and the same totals as before. *(closes Stage 2 criterion 4)*
- [ ] **AC9: Gate stays green.** `npm run lint && npm run build && npm test` exits 0; core's no-DOM boundary intact (serialize/deserialize are pure, DOM-free); no scoring/tally arithmetic added to the UI.

## Assumptions

- **A1:** Item 012's `GameSession`, `SessionError` and `SESSION_VERSION` (exported from `@carcassonne/core`) are the shapes persisted; `SessionError.kind` may be extended with the malformed/version-mismatch cases.
- **A2:** Item 014's `GameProvider` exposes an `initialSession` prop as the hydrate seam, and `newGame()` sets the session to `null`.
- **A3:** Item 002's `serializeBoard`/`deserializeBoard` (`packages/core/src/board/serialize.ts`) is the strict-version pattern to mirror.
- **A4:** Implementation was started under the legacy pipeline before the aide-loop migration (2026-09-27); the uncommitted work on the paths below is a starting point for the builder, not an accepted result — every AC is still validated from scratch.

## Implementation Steps

1. Review `packages/core/src/board/serialize.ts` (the `serializeBoard`/`deserializeBoard` + version-check pattern to mirror), `packages/core/src/session/` (types, `SessionError`, `SESSION_VERSION`), and the Item 014 provider's `initialSession` seam.
2. Add `serializeSession`/`deserializeSession` to `packages/core/src/session/serialize.ts` (extend `SessionError.kind` in `errors.ts` as needed); export from `@carcassonne/core`.
3. Add `packages/web/src/persistence/`: the `SessionStorage` interface + `createLocalSessionStorage` (localStorage-backed, swallows deserialize errors → null + clears bad key).
4. Wire the store: hydrate from `storage.load()` at startup (via `initialSession`); save on session change; clear on `newGame`.
5. No new dependency.

## Authorised paths

**May change:**

- `packages/core/src/session/serialize.ts` — the new serialize/deserialize pair
- `packages/core/src/session/errors.ts` — extend `SessionError.kind`
- `packages/core/src/session/index.ts` — re-export the pair
- `packages/core/src/index.ts` — export from `@carcassonne/core`
- `packages/core/test/session-serialize.test.ts` — core tests
- `packages/web/src/persistence/**` — storage abstraction + localStorage implementation
- `packages/web/src/state/GameProvider.tsx` — persist on change / clear on new game
- `packages/web/src/App.tsx` — hydrate at startup
- `packages/web/test/persistence.test.tsx` — web persistence + restore-flow tests
- `packages/web/test/App.test.tsx` — keep the shell test isolated from persisted state

**Asserts against:**

- None.

## Testing Strategy

- **Core (Vitest, node)** in `packages/core/test/session-serialize.test.ts`:
  - Round-trip: `deserializeSession(serializeSession(s))` deep-equals `s` for a non-trivial session.
  - Malformed: invalid JSON / missing fields / bad `delta` type throws `SessionError`.
  - Version mismatch: a payload with a different `version` throws `SessionError` (strict, like `deserializeBoard`).
- **Web (Vitest + jsdom)** in `packages/web/test/persistence.test.tsx`:
  - `createLocalSessionStorage` save→load round-trips an equal session via real jsdom `localStorage`; `clear` empties it.
  - `load` returns `null` for an absent key, blank value, corrupt JSON, and a version-mismatched payload (and clears the bad key) — no throw.
  - **Restore flow:** render the app with a pre-seeded storage value → app opens in the in-game view with the restored players/log/totals. Then `addScore` and re-mount a fresh app reading the same storage → the new event is present (persisted on change). `newGame` then re-mount → setup screen (cleared).
- **Gate:** `npm run lint && npm run build && npm test` (`aide.toml` `test_command` is `npm test`).

## Dependencies

- Item 002 — serialize/deserialize pattern to mirror.
- Item 012 — `GameSession` / `SessionError` / `SESSION_VERSION`.
- Item 014 — `initialSession` hydrate seam, `newGame`.
- Items 015–018 — the session being persisted.

**Downstream:** Stage 3 (durability hardening, atomic/crash-safe writes, offline/PWA, multi-game lifecycle, review & correction build on this); item 020 (e2e asserts reload-restores-game).

## Decisions & Trade-offs

- **`serializeSession` is a plain `JSON.stringify`.** Item 012's `GameSession`
  is already a JSON-round-trippable plain shape (players, events, version),
  so no intermediate DTO is needed — mirrors `serializeBoard`.
- **`deserializeSession` validates field-by-field and never returns a partial
  session.** It checks the JSON parses, that `version` is present and equals
  `SESSION_VERSION` (else throws `SessionError("version-mismatch", …)`), and
  that every player (`id`/`name`/`colourId`, non-empty strings) and every
  event (`id`/`playerId` strings, `delta`/`timestamp` finite numbers, optional
  `reason` string) is well-typed — else throws
  `SessionError("malformed-input", …)` with a field-path in the message
  (e.g. `events[2]: delta must be a finite number`). `SessionError.kind` was
  extended with these two cases alongside the existing session-construction
  ones (`player-count`, `duplicate-player-id`, `duplicate-colour`,
  `unknown-player`) rather than introducing a second error type, since
  callers already switch on `SessionError.kind`.
- **The `SessionStorage` interface (`load`/`save`/`clear`) is the only
  persistence seam the store touches.** `createLocalSessionStorage(key?)` is
  the sole `localStorage`-backed implementation; tests inject a fake instead
  of touching real browser storage. Keeping the interface tiny is what makes
  a Stage 3 backend swap (e.g. IndexedDB) not require touching
  `GameProvider`/`App`.
- **`load()` never throws — corrupt, absent, blank, and version-mismatched
  storage all collapse to `null`.** `localStorage.getItem` returning `null`
  or an all-whitespace string is treated as "no game" without attempting to
  deserialize. A `deserializeSession` throw (malformed JSON or version
  mismatch) is caught, the bad key is removed via `storage.removeItem` (so it
  can't poison a later load), and `null` is returned. Removal itself is
  best-effort: a further `removeItem` failure is swallowed rather than
  surfaced, since first-cut persistence must degrade rather than crash
  startup.
- **`localStorage` access is guarded at every entry point, not once at
  module load.** `getLocalStorage()` treats both "the global doesn't exist"
  (SSR/non-browser, though this app only ships to the browser — defensive
  parity with the board module's guards) and "accessing the global throws"
  (some browsers' privacy modes) as "unavailable," returning `undefined`
  rather than throwing. `save`/`clear` no-op when storage is unavailable;
  `load` returns `null`. `setItem` failures (e.g. quota exceeded mid-session)
  are also swallowed in `save` — a failed save silently drops that write
  rather than crashing the UI, accepting data loss over a crash for this
  first cut (Stage 3's durability hardening is explicitly out of scope here).
- **Startup hydrate goes through `App`, not `GameProvider`, so a literal
  `initialSession` override still works.** `App` resolves
  `initialSession = props.initialSession ?? storage.load()` and passes both
  the resolved session and the same `storage` instance into `GameProvider`.
  This keeps `GameProvider`'s own `initialSession` prop meaning exactly what
  Item 014 defined ("the session to start from"), with `App` deciding *where*
  that value comes from — real storage in production, an injected fake or a
  literal override in tests.
- **Save-on-change and clear-on-`newGame` are one `useEffect` in
  `GameProvider`, keyed on `state.session`.** When `state.session` is
  non-null it calls `storage.save(state.session)`; when it is `null` (set by
  `newGame`) it calls `storage.clear()`. This effect is the single place the
  store touches persistence, per the spec's "keep this the only place"
  design decision — no other component calls `storage.save`/`clear`
  directly. The first run after a startup hydrate re-saves the just-loaded
  session; this is a harmless no-op (same bytes back to the same key) rather
  than special-cased away, since guarding against it would add branching for
  no behavioural gain.
- **Both `App`'s and `GameProvider`'s default `storage` are the same
  `createLocalSessionStorage()` call site (module-level `defaultStorage` in
  each file), and `App` always passes its resolved `storage` down explicitly.**
  This guarantees the hydrate read and the save/clear writes agree on the
  same backing key even though `GameProvider` also declares its own default
  for standalone use (e.g. by tests that mount it without `App`).
- **Review fix: `deserializeSession` re-validates the same structural
  invariants `createSession`/`addScoreEvent` already enforce, by calling
  them, rather than duplicating the checks.** The original cut only checked
  field *types* (string/number/shape), so a syntactically well-typed but
  semantically invalid payload — e.g. two players sharing a `colourId`, an
  event's `playerId` naming no player in the session, or a player `colourId`
  that isn't a real meeple colour — deserialized successfully and only broke
  later, inside `PlayerScoreRow`/`PlayerEntryRow`'s `getMeepleColour` call
  during render, with no error boundary and the bad key never cleared (a
  crash-on-every-reload). `deserializeSession` now: (1) keeps its own
  field-shape checks, (2) additionally rejects a player `colourId` that
  `hasMeepleColour` (from `packages/core/src/colours`) doesn't recognise, as
  `"malformed-input"`; (3) calls `createSession(players)`, which throws its
  existing `"player-count"` / `"duplicate-player-id"` / `"duplicate-colour"`
  kinds unchanged; (4) rejects a duplicate event `id` as `"malformed-input"`
  (no existing kind covers this); (5) folds each event through
  `addScoreEvent(session, event)` in order, which throws its existing
  `"unknown-player"` kind unchanged and builds the returned session. Every
  new throw still surfaces as *some* `SessionError`, and `load()`'s catch is
  already unconditional (any throw → clear the key, return `null`), so no
  caller needed to change.
- **Review fix: `App`'s startup hydrate is a lazy `useState` initializer, not
  a render-body call.** `storage.load()` has a side effect (it clears a
  corrupt stored key via `removeItem`), so calling it directly in the render
  body ran it on every render and twice under StrictMode. `const
  [initialSession] = useState(() => …)` runs the resolution function exactly
  once, on mount.
- **Review fix: confirmed the score-entry UI *can* admit a non-finite
  `delta`, and guarded `GameProvider.addScore` against it, not
  `addScoreEvent`.** `PlayerEntryRow`'s custom-amount field only checks
  `/^[+-]?\d+$/` before `Number.parseInt`; a several-hundred-digit string
  passes that regex but `Number.parseInt` rounds it to `Infinity`. Left
  unguarded, that `delta` would reach `addScoreEvent`, then
  `serializeSession`'s bare `JSON.stringify`, which silently turns
  `Infinity`/`NaN` into `null` — which `deserializeSession` then rejects,
  deleting the whole persisted game on the next load. The natural fix
  location is `addScoreEvent` itself (`packages/core/src/session/session.ts`),
  mirroring the `Number.isFinite` check `parseScoreEvent` already applies —
  but that file is not in this item's Authorised paths (`## Authorised
  paths` lists `session/serialize.ts`, `session/errors.ts`,
  `session/index.ts`, not `session/session.ts`), so it was left unmodified.
  Instead, `addScore` in `GameProvider.tsx` (which *is* authorised) now
  checks `Number.isFinite(delta)` before calling `addScoreEvent`, and
  silently ignores the call otherwise — mirroring the existing "no session
  in progress" guard immediately above it in the same function, which
  likewise ignores bad input rather than throwing from an event handler.
  **Left open:** hardening `addScoreEvent` itself with the same
  `Number.isFinite` check, so every future caller (not just
  `GameProvider.addScore`) gets the guarantee for free, needs a path outside
  this item's Authorised paths and should be picked up by whichever item
  next touches `session/session.ts`.
- **Review fix: `GameProvider`'s persist effect no longer clears storage on
  the very first mount.** The save/clear `useEffect` ran on every render
  where `state.session` changed, including the initial one; when nothing was
  restored (`state.session` starts `null`), that first run called
  `storage.clear()` — a no-op today, but one that fires before `App`'s
  `useState` hydrate read and this effect are guaranteed to agree on
  ordering, and needlessly widens the window in which a corrupt-then-cleared
  key could interact with a subsequent write. A `useRef` flag now skips the
  `null`-branch clear on the initial mount only (a non-null initial session
  still saves, as before); a later transition to `null` — `newGame`, the
  only current source of one — still clears, keeping AC7 intact.
