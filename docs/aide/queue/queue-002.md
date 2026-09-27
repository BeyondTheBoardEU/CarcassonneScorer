# Carcassonne Scorer — Work Queue 002

> **Created:** 2026-06-20
> **Document role:** Step 4 of the AIDE workflow. Derived from [`vision.md`](../vision.md), [`roadmap.md`](../roadmap.md), and [`progress.md`](../progress.md). A prioritized batch of the next ~10 actionable work items. Each item is testable locally and the batch is sized for roughly a week.

---

## Scope of this queue

This is the **second** queue. [Stage 1](../roadmap.md#stage-1--foundation-tile-catalog--scoring-engine-core) is ✅ complete (Items 001–010: platform-independent core, single base-game catalog, scoring engine with `scoreBoard`, all unit-tested). This batch fully addresses **Stage 2 — Manual scorepad MVP (base game)**: the first *demonstrable product* — a usable web app where a group sets up a base-game session and tracks scores by hand with always-visible totals, persisted locally.

Stage 2 introduces the **first UI/app layer**. It wraps the Stage 1 core in a thin UI and adds a local persistence cut. Two disciplines from the vision govern it: **no scoring/tally arithmetic in the UI** (totals come from a pure, platform-independent module — principle 6), and **accessibility** (meeple-colour selection must not rely on colour alone). PWA installability and full offline hardening are **Stage 3**, not here; Stage 2 persistence is a first cut via local storage.

The items are ordered so each builds on the last: web scaffold → pure session/tally model → meeple-colour data → app state shell → setup UI → scoreboard → score entry → event log → persistence → end-to-end acceptance suite. Completing all ten satisfies every Stage 2 deliverable and acceptance criterion.

**Tech note (deferred specifics):** the repo is a TypeScript npm-workspaces monorepo (`packages/core`) tested with Vitest. The web app should slot into that monorepo and reuse `@carcassonne/core`; the exact UI framework and component/e2e test tooling are chosen in Item 011's work-item spec (a lightweight Vite-based framework + a component test runner, plus an e2e runner for Item 020), not pre-locked here. Any new scoring/tally logic lives in a platform-independent module (core or a shared package), never in components.

**Vision trace for this batch:** G1 (eliminate manual tallying — manual first cut), G3 (never lose the score — first cut, localStorage), G6 (player counts 2–6, standard meeple colours); principles 1 (spec-first), 3 (persistence/offline, first cut), 6 (platform-independent core, no UI scoring duplication); features 4.1 (manual scorepad), 5.3 (UI/presentation, score state & persistence); NFR accessibility/usability.

---

## Work items

### Item 011: Web app scaffold over the core
Add a web application project to the monorepo (e.g. `packages/web` or `apps/web`) using a lightweight Vite-based UI framework, wired into the existing TypeScript/npm-workspaces/Vitest setup with build, lint, dev-server, and test scripts. The app imports and renders something trivial from `@carcassonne/core` to prove the dependency wiring and the platform boundary (UI depends on core, never the reverse). Establish the component test runner (e.g. Vitest + a DOM/testing-library) and add a single smoke test that mounts the app shell and asserts it renders. Choose and document the framework + test tooling in the work-item spec. Deliverable: a runnable web app (`dev` serves it, `build` succeeds, `test` passes) that consumes the core. (Stage 2 deliverable: thin UI layer foundation; acceptance precursor for all UI items.)

### Item 012: Scorepad session model and tally reducer (platform-independent)
Define the manual-scorepad domain in a platform-independent module (in `packages/core` or a shared package — **not** in the UI): a `Player` (id, name, colour id), a `ScoreEvent` (target player, point delta, timestamp, optional reason), and a `GameSession` (players + ordered event log + schema version). Implement a **pure tally reducer** that derives each player's running total from the event log, plus constructors for starting a session and appending events. All structures are JSON-serializable (for Item 019 persistence). This is the "totals come from the core" engine for manual entry — no summation logic may live in components. Deliverable: typed, documented session model + pure reducer with unit tests (totals from a sequence of add/adjust events, serialization round-trip). (Stage 2 deliverable: score model behind setup/scoreboard/log; principle 6.)

### Item 013: Standard meeple colour set (accessible)
Author the standard Carcassonne meeple colour set as reusable **data** (id, display name, colour value, and a non-colour distinguisher such as a label/pattern/icon) in a small module consumed by setup and the scoreboard. This encodes the accessibility NFR — colours must be distinguishable without relying on hue alone — and the G6 "all standard meeple colours" requirement, as a single source of truth analogous to the tile catalog. Deliverable: the colour-set data + a typed accessor and helpers (look up by id, list available, detect duplicates), unit-tested. (Stage 2 deliverable: meeple-colour selection; NFR accessibility.)

### Item 014: App state store and game-shell lifecycle
Introduce the app's state container and shell: a store that holds the current `GameSession` (Item 012), exposes derived totals via the reducer, and dispatches score events; plus a shell that routes between the **setup** view and the **in-game** view based on whether a game is in progress. No scoring math in the store beyond delegating to the core reducer. This is the seam every subsequent UI item binds to and that Item 019 persistence hooks into. Deliverable: a state store + app shell with view routing (setup ↔ play), with tests for state transitions (start game → in-game; dispatch event → totals update). (Stage 2 deliverable: thin UI over core, single source of game state.)

### Item 015: Game setup UI
Build the setup screen: choose **2–6 players**, give each a name and assign a meeple colour from the Item 013 set, with **distinct** colours enforced and colour conveyed with a label/pattern (not colour alone). On confirm, it produces a valid `GameSession` and transitions the shell to the in-game view. Deliverable: a setup UI component wired to the store, with component tests (add/remove players within 2–6 bounds, duplicate-colour prevention, names captured, valid session produced). (Stage 2 deliverable: game setup; acceptance: "set up a 2–6 player game, name players, assign distinct colours".)

### Item 016: Running scoreboard UI
Build the always-visible scoreboard: each player's name, meeple colour (with the accessible label/pattern), and **current total** read from the Item 012 reducer via the store — readable at a glance. Totals are display-only here (entry is Item 017) and must reflect the derived totals with no arithmetic in the component. Deliverable: a scoreboard component with component tests (renders all players, shows correct totals from a session, updates when the session changes). (Stage 2 deliverable: running scoreboard; acceptance: always-visible per-player totals.)

### Item 017: Manual score entry UI
Build manual score entry: add or adjust points (positive or negative) for **any player at any time**, dispatched as `ScoreEvent`s through the store so totals update **immediately** on the scoreboard. Include sensible input affordances (quick increments and/or a custom amount, optional reason). No summation in the component — it only emits events. Deliverable: a score-entry UI wired to the store, with component tests (adding/adjusting points appends an event and the derived total updates immediately; negative adjustments work). (Stage 2 deliverable: manual score entry; acceptance: "add/adjust points for any player; totals update immediately".)

### Item 018: Score event log UI
Build the score event log view: every score change shown as a traceable entry (which player, how many points, when, and the reason if given), in order, forming the basis for Stage 3's review/correction. Stage 2 is **display-only** — editing/reversing entries is Stage 3 and out of scope here. Deliverable: an event-log component reading the session's event log via the store, with component tests (every dispatched score change appears as a log entry with correct details and ordering). (Stage 2 deliverable: score event log; acceptance: "every score change appears in the event log".)

### Item 019: Local persistence (first cut)
Persist the in-progress game so a reload restores it: serialize the `GameSession` (players, event log, and thus derived totals) to local storage on change, and rehydrate it into the store on app startup. Use a small storage abstraction (interface + localStorage implementation) so it is testable and swappable, and version the stored payload (reuse the session schema version). This is the **first cut** only — atomic/crash-safe durability, offline/PWA, and corruption handling are Stage 3. Deliverable: a persistence module wired to the store, with tests (save→reload restores an equal session; absent/blank storage starts cleanly; version mismatch handled gracefully). (Stage 2 deliverable: local persistence first cut; acceptance: "reloading restores the exact in-progress game".)

### Item 020: Stage 2 acceptance end-to-end suite
Build an end-to-end test suite (using the e2e runner chosen in Item 011) that drives the assembled app through the Stage 2 acceptance criteria as a user would, and serves as the Stage 2 regression net: set up a 2–6 player game with distinct colours; add and adjust points for multiple players and observe totals update immediately; confirm every change appears in the event log; reload the app and confirm the exact in-progress game (players, totals, log) is restored; and confirm no scoring arithmetic is duplicated in the UI (totals trace to the core reducer). Deliverable: a passing, named e2e suite that demonstrably satisfies every Stage 2 acceptance criterion. (Stage 2 deliverable: comprehensive acceptance; mirrors Item 010's role for Stage 1.)

---

## Completion check

When all ten items are complete, **Stage 2** is done: a usable web app over the Stage 1 core lets a group set up a 2–6 player base-game session with distinct, accessibly-labelled meeple colours; add/adjust points with immediately-updating, always-visible totals; see every change in a traceable event log; and reload without losing the in-progress game — all with the tally/scoring logic living in the platform-independent core, not the UI, and all verified by component and end-to-end tests.

---

## Next Step

Queue state is derived from [`progress.md`](../progress.md), never declared here. Run `/aide-run-queue` to claim and drive the remaining items (spec → tests → build → validate → merge); when every queue is done, `/aide-create-queue` (or `/aide-run-roadmap`) authors the next batch.
