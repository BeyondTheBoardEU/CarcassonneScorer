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

To be updated during implementation.
