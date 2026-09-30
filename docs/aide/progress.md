<!-- aide-template: progress 1 -->
# Carcassonne Scorer — Progress Tracker

> **Status:** Active · **Created:** 2026-06-14 · **Last updated:** 2026-09-27 (mirrors the prototype-posture roadmap: stages 1–8; per-item implementation notes live in [`items/`](items/) and the legacy run records in [`runs/`](runs/))
> Step 3 of the AIDE loop · mirrors [`roadmap.md`](roadmap.md) · the single
> source of truth for status; queue state is derived from it, and item specs
> deliberately carry none.

## Status legend

| Icon | Meaning |
|------|---------|
| 📋 | Planned |
| 🚧 | In Progress |
| 🔍 | In Review |
| ✅ | Complete |
| ⏸️ | Deferred |
| ❌ | Excluded |

## Stage summary

| Stage | Title | Objectives | Status |
|-------|-------|-----------|--------|
| 1 | Foundation: tile catalog + scoring engine core | G6 | ✅ |
| 2 | Manual scorepad MVP (base game) | G1, G3, G6 | 🚧 |
| 3 | Offline durability + review & correction | G3, G4 | 📋 |
| 4 | End-game tally assistant including farmers | G1, G4 | 📋 |
| 5 | Expansion coverage (major expansions) | G5, G6 | 📋 |
| 6 | Photo-based feature scoring | G2, G4, G5 | 📋 |
| 7 | Photo-based final scoring | G1, G2, G4, G5 | 📋 |
| 8 | Board validation | G4, G5 | 📋 |

## Objective coverage

| Objective | Delivered by | Status |
|-----------|--------------|--------|
| G1 Eliminate manual tallying | Stages 2, 4, 7 | 🚧 |
| G2 Fast, correct scoring from a photo | Stages 6, 7 | 📋 |
| G3 Never lose the running score | Stages 2, 3 | 🚧 |
| G4 Trustworthy automation | Stages 3, 4, 6, 7, 8 | 📋 |
| G5 Graceful degradation | Stages 5, 6, 7, 8 | 📋 |
| G6 Broad coverage | Stages 1, 2, 5 | 🚧 |

## Outcome targets

| Target | Objective | Attempted by | Status | Evidence / follow-up |
|--------|-----------|--------------|--------|----------------------|
| A reviewable result within seconds for a typical feature photo | G2 | Stage 6 | ❓ Unverified | — |

---

## Stage 1 — Foundation: tile catalog + scoring engine core — ✅

**Goal.** Platform-independent core that scores base-game features from board state, unit-tested. *(Maturity phase: Scorepad · Dependencies: none)*

**Deliverables.**

- ✅ Project scaffold separating a platform-independent core (no UI, no platform APIs) from everything else. *(Item 001)*
- ✅ Board-state model: placed tiles, positions/orientations, and meeple placements, independent of how the state was produced. *(Item 002)*
- ✅ Tile catalog (base game): data-driven definition of every base-game tile in one authoritative source format — format, loader and rotation helpers (003), all 24 base-game tile types (004). *(Items 003, 004)*
- ✅ Catalog-validation tests asserting internal consistency (edges match, no malformed tiles). *(Item 005)*
- ✅ Scoring engine (base game, incremental): completed cities, roads and monasteries with majority/tie meeple ownership — feature extraction (006), ownership (007), city/road scoring (008), monastery scoring and the `scoreBoard` entry point (009). *(Items 006–009)*
- ✅ Comprehensive unit tests for canonical base-game scenarios (single owner, contested/tied, pennants, monastery completion). *(Item 010)*

**Acceptance.**

- [x] Core module has zero UI/platform dependencies and runs in isolation.
- [x] Engine returns correct scores for completed cities, roads, and monasteries from a hand-authored board state (automated tests).
- [x] Contested features award points by official majority/tie rules (tests).
- [x] Base-game catalog passes internal-consistency checks.

**Vision trace:** G6; principles 1/2/6; features 5.1 (foundation), 5.5; architecture §6 (core).

---

## Stage 2 — Manual scorepad MVP (base game) — 🚧

**Goal.** Usable web app to set up a base-game session and track scores by hand with live totals, persisted locally. *(Maturity phase: Scorepad · Dependencies: Stage 1)*

**Deliverables.**

- ✅ Thin UI over the Stage 1 core; no scoring logic duplicated in the UI — web scaffold (011), app state store and game-shell lifecycle (014). *(Items 011, 014)*
- ✅ Score model / totals from the core: platform-independent session model and `computeTotals` tally reducer. *(Item 012)*
- ✅ Game setup: 2–6 players, name + meeple colour from the standard set; colour selection does not rely on colour alone — accessible colour-set data (013), setup UI (015). *(Items 013, 015)*
- ✅ Running scoreboard: always-visible current totals per player, readable at a glance. *(Item 016)*
- ✅ Manual score entry: add or adjust points for any player at any time. *(Item 017)*
- ✅ Score event log: every change recorded as a traceable event (who, how many, when/why). *(Item 018)*
- ✅ Local persistence (first cut): game state and event log saved to local storage; reload restores the in-progress game. *(Item 019)*
- 📋 Stage 2 acceptance end-to-end suite driving the assembled app through every Stage 2 criterion. *(Item 020)*

**Acceptance.**

- [x] Set up a 2–6 player game, name players, assign distinct meeple colours.
- [x] Add/adjust points for any player; totals update immediately. *(Item 016 delivered the "totals update immediately" / always-visible half via the live `Scoreboard`; Item 017 ✅ adds the "add/adjust points for any player" entry controls — quick increments and a custom +/- amount, dispatched via `addScore` for any player in the session.)*
- [x] Every score change appears in the event log. *(Item 018 ✅: the `EventLog` component renders every entry in `session.events` in sync with count and content, in a documented newest-first deterministic order; verified by the checker against dispatched `addScore` events.)*
- [x] Reloading restores the exact in-progress game (players, totals, log). *(Item 019 AC8 verified 2026-09-30 via aide test (exit 0, 366 tests) incl. packages/web/test/persistence.test.tsx restore-flow: pre-seeded storage restores play view with players/totals, event log entries present, addScore+remount reflects persisted event, newGame+remount returns to setup with storage cleared.)*
- [x] No scoring arithmetic in the UI — totals come from the core. *(Item 016 established the scoreboard performs no summation; Item 017 ✅ completes the end-to-end proof: entry → core `addScoreEvent` → `computeTotals` → scoreboard, with no `reduce`/sum/tally logic anywhere in `packages/web/src`, confirmed by the checker.)*

**Vision trace:** G1, G3 (first cut), G6; feature 5.1; constraint "accessibility"; architecture §6 (web, persistence).

---

## Stage 3 — Offline durability + review & correction — 📋

**Goal.** Make the scorepad installable and fully offline; make every score change reviewable and reversible. *(Maturity phase: Scorepad · Dependencies: Stage 2)*

**Deliverables.**

- 📋 PWA installability: install (home-screen/standalone) and launch without a network.
- 📋 Offline operation: full scorepad functionality with no network, verified with network disabled.
- 📋 Durability hardening: state survives reload, crash/abrupt close, and device sleep; writes atomic enough that a partial write cannot corrupt the game.
- 📋 Review & correction UI: browse the score event log; edit or reverse any past entry with totals recomputing correctly.
- 📋 Game lifecycle: start a new game, end/finalise the current game, resume an unfinished game.

**Acceptance.**

- [ ] App installs and opens with the network fully disabled and stays functional.
- [ ] Killing the app/tab mid-game and reopening restores it without loss or corruption.
- [ ] Any logged score event can be edited or reversed; totals reconcile correctly.
- [ ] A finished game can be finalised and a new game started without losing the ability to review the prior one (until explicitly cleared).

**Vision trace:** G3, G4 (review); principle 3; feature 5.1; success criteria 3, 8.

---

## Stage 4 — End-game tally assistant including farmers — 📋

**Goal.** Guide players through end-of-game final scoring, including manual farmer/field scoring, with a verifiable per-player breakdown. *(Maturity phase: Scorepad · Dependencies: Stage 1, Stage 3)*

**Deliverables.**

- 📋 Final-scoring engine (base game): end-game scoring of incomplete cities/roads, monasteries, and farmer/field scoring (fields scored by completed bordering cities, with field-majority ownership), unit-tested.
- 📋 Guided end-game flow: step-by-step UI walking the scorekeeper through each end-game category to confirm or enter values per feature.
- 📋 Per-player breakdown: final total decomposed by category (completed, incomplete, monasteries, farmers).
- 📋 Finalised result: reviewed end-game tally becomes the official final scoreboard.

**Acceptance.**

- [ ] Final-scoring engine computes farmer/field scores correctly for canonical layouts (automated tests).
- [ ] User can run the guided end-game flow to completion and produce a final scoreboard.
- [ ] Final total shown broken down per player and per category.
- [ ] User can correct any end-game value before finalising.

**Vision trace:** G1, G4; features 5.1 (end-game tally), 5.3 (farmer logic, manual precursor); success criterion 1; phase "Scorepad".

---

## Stage 5 — Expansion coverage (major expansions) — 📋

**Goal.** Extend catalog and scoring engine to the major/common expansions so coverage holds up under enthusiast play. *(Maturity phase: Scorepad · Dependencies: Stage 1, Stage 4)*

**Deliverables.**

- 📋 Defined supported set: explicit list of targeted major expansions (recorded here and in the catalog); anything outside is unsupported.
- 📋 Catalog extension: targeted expansions' tiles/pieces added to the single catalog in the same authoritative format.
- 📋 Scoring rules per expansion: incremental and end-game rules per supported expansion in the core engine.
- 📋 Setup support: game setup lets players enable the expansions in play.
- 📋 Expanded test suite: scoring scenarios per expansion, including interactions with base-game scoring.
- 📋 Loud failure for unsupported pieces: anything outside the supported set is clearly flagged, never silently mis-scored.

**Acceptance.**

- [ ] Supported-expansion set is explicitly documented.
- [ ] Each supported expansion's tiles exist in the single catalog and pass consistency checks.
- [ ] Incremental and end-game scoring per supported expansion are correct (automated tests).
- [ ] Enabling expansions at setup changes scoring behaviour accordingly.
- [ ] An unsupported piece produces a clear "not supported" signal, never a silent guess.

**Vision trace:** G5, G6; principles 2/5; features 5.5, 5.6; success criterion 6.

---

## Stage 6 — Photo-based feature scoring — 📋

**Goal.** Photograph a completed structure (or a selected region) on-device and receive a correct, reviewable score that is committed to the scoreboard only when a human confirms it. *(Maturity phase: Feature scoring · Dependencies: Stage 3, Stage 4, Stage 5)*

**Deliverables.**

- 📋 Photo capture: capture an image of the board (or part) from the device camera, on-device, no upload.
- 📋 Region selection: indicate a region of the photo (draw/tap-to-select) to constrain what gets scored.
- 📋 Single-feature recognition: turn a photo of a completed city/road/monastery (or the selected region) into the board state needed to score it, or report explicitly that it cannot.
- 📋 Feature scoring from photo: run the Stage 1/Stage 5 engine over the recognised feature.
- 📋 Proposed vs committed score: proposed results kept separate from committed ones; the review flow shows feature, score and credited meeples/players, and confirm commits a normal logged score event while reject/correct leaves committed totals alone.
- 📋 Clear failure + fallback: an uninterpretable photo says so plainly and offers manual entry for that feature.

**Acceptance.**

- [ ] App captures a board photo on-device with no network upload.
- [ ] User can select a region of a captured photo.
- [ ] For a clearly photographed completed feature, the app proposes the correct score and correct meeple/player crediting.
- [ ] A proposed result is never in committed totals until the user confirms it; rejecting leaves committed totals unchanged.
- [ ] A confirmed photo score appears in the event log and is reversible like any manual entry.
- [ ] An uninterpretable photo yields a clear message and manual-entry fallback — never a fabricated score.

**Vision trace:** G2, G4, G5; principles 4/5; features 5.2, 5.6; constraint "privacy"; success criteria 2, 4, 5; phase "Feature scoring". The "within seconds" goal is tracked under Outcome targets.

---

## Stage 7 — Photo-based final scoring — 📋

**Goal.** Photograph the finished board and produce the complete end-of-game tally automatically — including farmers — fully reviewable before it becomes official. *(Maturity phase: Final scoring · Dependencies: Stage 6, Stage 4, Stage 5)*

**Deliverables.**

- 📋 Full-board recognition: turn a photo (or set of photos) of the finished board into a complete board state.
- 📋 Full final scoring from photo: run the Stage 4/Stage 5 end-game engine — incomplete cities/roads, monasteries, and farmer/field scoring across the whole board — over the recognised state.
- 📋 Per-player breakdown: complete computed final score decomposed per player and per category.
- 📋 Whole-result review: entire computed final tally presented for human review and correction before it becomes official.
- 📋 Partial-recognition handling: unreadable parts fail loudly and drop to manual entry while the rest is computed.

**Acceptance.**

- [ ] For a clearly photographed finished base-game board, the app produces a complete final tally including correct farmer scoring.
- [ ] Full computed result shown per-player and per-category and correctable before finalising.
- [ ] No computed final result becomes official without explicit human confirmation.
- [ ] Unrecognised regions are flagged and routed to manual entry, not guessed.

**Vision trace:** G1, G2, G4, G5; features 5.3, 5.6; success criteria 1, 2, 4, 5; phase "Final scoring".

---

## Stage 8 — Board validation — 📋

**Goal.** Detect illegal tile placements and configurations and report them clearly for human judgement — assist and flag, never override. *(Maturity phase: Validation · Dependencies: Stage 1, Stage 7, Stage 5)*

**Deliverables.**

- 📋 Validation engine: platform-independent logic checking a board state against the catalog for illegal placements/configurations (edge mismatches, illegal adjacencies, invalid meeple placements).
- 📋 Validation from recognised or known state: run validation over board state from recognition (Stage 7) or otherwise known state.
- 📋 Clear reporting: for each flagged issue, explain what appears wrong and where.
- 📋 Advisory only: flags surfaced for human decision; never auto-correct or override.
- 📋 Validation test suite: legal and illegal configurations across base game and supported expansions.

**Acceptance.**

- [ ] Validation engine correctly flags canonical illegal configurations and passes legal ones (automated tests).
- [ ] Each flag identifies what is wrong and where, in terms a player can act on.
- [ ] Validation never modifies the score or board on its own — it only reports.
- [ ] Recognition-induced false positives are presented as "review this," consistent with human-in-the-loop.

**Vision trace:** G4, G5; principles 2/4/5; features 5.4; success criterion 7; phase "Validation".

---

## Cross-cutting notes

- **Native mobile apps** — out of scope for now (vision §8); the platform-independent core keeps the option open.
- **Accessibility and privacy constraints** (vision §7) — embedded in the acceptance criteria where they first apply: colour-not-alone meeple colours in Stage 2, on-device/no-upload capture in Stage 6.
