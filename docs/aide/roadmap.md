# Carcassonne Scorer — Roadmap

> **Status:** Draft v1 · **Last updated:** 2026-06-14
> **Document role:** Step 2 of the AIDE workflow. Derived from [`vision.md`](./vision.md). Breaks the vision into staged, demonstrable deliverables. Progress, queue, and work items derive from this document. Scope changes happen in the vision first, then propagate here.

---

## How to read this roadmap

Each **stage** delivers a demonstrable, testable version of the product that builds on the stages before it. Stages are scoped to be deployable locally and deliverable in roughly a week. Within a stage:

- **Goal** — the one-sentence outcome the stage exists to achieve.
- **Deliverables** — the specific, concrete things built.
- **Dependencies** — which earlier stages must be complete first.
- **Validation / acceptance** — how we know the stage is done and demonstrable (mirrored as `progress.md` acceptance boxes).
- **Vision trace** — which vision goals/features/principles the stage advances.

The progression honours the vision's committed architectural principles from the start: a **single tile catalog** drives everything (Stage 1), the **core is platform-independent** (Stages 1, 4), the **running score is never lost and works offline** (Stages 2–3), **automation is always reviewable** (the proposed/committed boundary appears the moment recognition does, Stage 6), and **unsupported input fails loudly** (Stages 7–9).

---

## Stage map

| Stage | Title | Maturity phase | Outcome |
|-------|-------|----------------|---------|
| 1 | Foundation: tile catalog + scoring engine core | Scorepad | Platform-independent core that scores base-game features from board state, unit-tested. |
| 2 | Manual scorepad MVP (base game) | Scorepad | Installable-track web app: set up a game, enter scores, see live totals, persisted locally. |
| 3 | Offline durability + review & correction | Scorepad | PWA installable & offline; score log is reviewable and reversible; no state ever lost. |
| 4 | End-game tally assistant incl. farmers | Scorepad | Guided final scoring, including manual farmer/field scoring, with per-player breakdown. |
| 5 | Expansion coverage (major expansions) | Scorepad | Catalog + scoring extended to the major expansions; coverage that scores correctly. |
| 6 | Recognition foundation: capture, regions, proposed/committed boundary | Feature scoring | Photo capture + region selection feed a board-state model; proposed vs committed score is real. |
| 7 | Photo-based feature scoring | Feature scoring | Photograph a completed structure or selected region, get a reviewable score, apply it. |
| 8 | Photo-based final scoring | Final scoring | Photograph the finished board, get the complete reviewable end-game tally incl. farmers. |
| 9 | Board validation | Validation | Detect and clearly report illegal placements/configurations for human judgement. |

### Objective → stage coverage

Derived from each stage's **Vision trace** line below.

| Objective | Delivered by |
|-----------|--------------|
| G1 Eliminate manual tallying | Stages 2, 4, 8 |
| G2 Fast, correct scoring from a photo | Stages 6, 7, 8 |
| G3 Never lose the running score | Stages 2, 3 |
| G4 Trustworthy automation | Stages 3, 4, 6, 7, 8, 9 |
| G5 Graceful degradation | Stages 5, 6, 7, 8, 9 |
| G6 Broad coverage | Stages 1, 2, 5 |

---

## Stage 1 — Foundation: tile catalog + scoring engine core

**Goal:** Establish the single tile catalog and a platform-independent scoring engine that correctly scores base-game features from a board-state representation.

This stage builds no UI. It establishes the architectural spine the entire product depends on: one authoritative catalog and a pure, reusable scoring core. Getting this right first is what keeps scoring, validation, and recognition from ever diverging.

**Deliverables:**
- Project scaffold with a clear separation between a platform-independent **core** package/module (no UI, no platform APIs) and everything else.
- **Tile catalog (base game):** a data-driven definition of every base-game tile, its edges (city/road/field/monastery segments), and the pieces/features it can carry. One authoritative source format.
- **Board-state model:** a representation of placed tiles, their positions/orientations, and meeple placements that the scoring engine consumes — independent of how that state was produced (manual or, later, recognition).
- **Scoring engine (base game, incremental):** computes scores for completed cities, roads, and monasteries from board state, including majority/tie meeple ownership rules.
- Comprehensive unit tests covering canonical base-game scoring scenarios (single owner, contested/tied features, pennants, monastery completion).
- Catalog-validation tests asserting the catalog is internally consistent (edges match, no malformed tiles).

**Dependencies:** none.

**Validation / acceptance.**
- The core module has zero UI or platform dependencies and can be imported and exercised in isolation.
- Given a hand-authored board state, the engine returns correct scores for completed cities, roads, and monasteries, verified by automated tests.
- Contested features award points by the official majority/tie rules, verified by tests.
- The base-game catalog passes its internal-consistency checks.

**Vision trace:** G6, principles 1/2/6; features 4.1 (foundation), 4.5, 5.3 (catalog, scoring engine).

---

## Stage 2 — Manual scorepad MVP (base game)

**Goal:** A usable web app where a group can set up a base-game session and track scores by hand with always-visible totals, persisted locally.

This is the first demonstrable product: pen-and-paper replacement. It wraps the Stage 1 core in a thin UI and introduces local persistence.

**Deliverables:**
- **Game setup:** choose 2–6 players, assign each a name and a meeple colour from the standard set. Colour selection does not rely on colour alone (label/pattern) per accessibility NFR.
- **Manual score entry:** add or adjust points for any player at any time.
- **Score event log:** every change recorded as a traceable event (who, how many, when/why), forming the basis for later review/correction.
- **Running scoreboard:** always-visible current totals per player, readable at a glance.
- **Local persistence (first cut):** the game state and event log are saved to local storage so a reload restores the in-progress game.
- Thin UI layer over the Stage 1 core; no scoring logic duplicated in the UI.

**Dependencies:** Stage 1.

**Validation / acceptance.**
- A user can set up a 2–6 player game, name players, and assign distinct meeple colours.
- Points can be added/adjusted for any player and totals update immediately.
- Every score change appears in the event log.
- Reloading the page restores the exact in-progress game (players, totals, log).
- No scoring arithmetic lives in the UI — totals come from the core.

**Vision trace:** G1, G3 (first cut), G6 (player counts/colours), features 4.1, 5.3 (UI, persistence).

---

## Stage 3 — Offline durability + review & correction

**Goal:** Make the scorepad installable and fully offline, and make every score change reviewable and reversible so nothing is final until the game ends.

This stage hardens the durability and trust guarantees the vision treats as architectural, not optional.

**Deliverables:**
- **PWA installability:** the app can be installed (home-screen/standalone) and launches without a network.
- **Offline operation:** full scorepad functionality with no network connection, verified with the network disabled.
- **Durability hardening:** state survives reload, crash/abrupt close, and device sleep — not just a clean reload. Writes are atomic enough that a partial write cannot corrupt the game.
- **Review & correction UI:** browse the score event log; edit or reverse any past entry with totals recomputing correctly.
- **Game lifecycle:** start a new game, end/finalise the current game, and resume an unfinished game.

**Dependencies:** Stage 2.

**Validation / acceptance.**
- The app installs and opens with the network fully disabled and remains fully functional.
- Killing the app/tab mid-game and reopening restores the game without loss or corruption.
- Any logged score event can be edited or reversed, and totals reconcile correctly afterward.
- A finished game can be finalised and a new game started without losing the ability to review the prior one (at least until explicitly cleared).

**Vision trace:** G3, G4 (review), principle 3, NFR reliability/offline, features 4.1, 4.6.

---

## Stage 4 — End-game tally assistant including farmers

**Goal:** Guide players through the end-of-game final scoring — the part they most dislike — including manual farmer/field scoring, with a verifiable per-player breakdown.

Still fully manual, but this removes the hardest arithmetic and rules lookup of a base-game session.

**Deliverables:**
- **Final-scoring engine (base game):** core logic for end-game scoring of incomplete cities/roads, monasteries, and **farmer/field scoring** (fields scored by completed cities they border, with field-majority ownership), exercised by unit tests.
- **Guided end-game flow:** a step-by-step UI that walks the scorekeeper through each end-game scoring category and lets them confirm or enter values per feature.
- **Per-player breakdown:** the final total shown decomposed by category (completed features, incomplete features, monasteries, farmers) so players can verify it.
- **Finalised result:** the reviewed end-game tally becomes the official final scoreboard.

**Dependencies:** Stage 1 (catalog/board state), Stage 3 (lifecycle + review).

**Validation / acceptance.**
- The final-scoring engine computes farmer/field scores correctly for canonical layouts, verified by automated tests.
- A user can run the guided end-game flow to completion and produce a final scoreboard.
- The final total is shown broken down per player and per category.
- The user can correct any end-game value before finalising.

**Vision trace:** G1, G4, features 4.1 (end-game tally), 4.3 farmer logic (manual precursor), success phase "Scorepad".

---

## Stage 5 — Expansion coverage (major expansions)

**Goal:** Extend the catalog and scoring engine to the major/common expansions so coverage holds up under enthusiast play.

This is where the single-catalog discipline pays off: expansions are added as catalog data plus scoring rules, reused by everything downstream.

**Deliverables:**
- **Defined supported set:** an explicit list of the major expansions targeted in this stage (recorded here and in the catalog), with anything outside it treated as unsupported.
- **Catalog extension:** the targeted expansions' tiles and pieces added to the single catalog in the same authoritative format.
- **Scoring rules per expansion:** incremental and end-game scoring rules for each supported expansion implemented in the core engine.
- **Setup support:** game setup lets players enable the expansions in play.
- **Expanded test suite:** scoring scenarios per expansion, including interactions with base-game scoring.
- **Loud failure for unsupported pieces:** anything outside the supported set is clearly flagged rather than silently mis-scored.

**Dependencies:** Stage 1, Stage 4 (so both incremental and end-game scoring extend together).

**Validation / acceptance.**
- The supported-expansion set is explicitly documented.
- Each supported expansion's tiles exist in the single catalog and pass consistency checks.
- Incremental and end-game scoring for each supported expansion are correct per the official rules, verified by automated tests.
- Enabling expansions at setup changes scoring behaviour accordingly.
- An unsupported piece produces a clear "not supported" signal, never a silent guess.

**Vision trace:** G5, G6, principle 2/5, features 4.5, 4.6.

---

## Stage 6 — Recognition foundation: capture, regions, proposed/committed boundary

**Goal:** Introduce the camera and the proposed-vs-committed score boundary, with capture and region-selection feeding a board-state model — before any automated interpretation is trusted.

This stage builds the scaffolding that makes photo scoring trustworthy. The recognition layer can start as a stub/manual-assist; the architectural boundary is the real deliverable.

**Deliverables:**
- **Photo capture:** capture an image of the board (or part of it) from the device camera, on-device, with no upload (privacy NFR).
- **Region selection UI:** let the user indicate a region of the board (draw/tap-to-select) to constrain what gets scored.
- **Recognition-layer interface:** a defined boundary that takes an image (and optional region) and returns either a partial board state or an explicit "cannot interpret." Initial implementation may be a stub that hands off to manual entry.
- **Proposed vs committed score:** the score state model gains a clear separation between *proposed* results (from any automated path) and *committed* results; nothing automated is committed without an explicit human confirm.
- **Review-and-apply flow shell:** a UI flow that shows a proposed result and lets the user confirm (commit) or reject/correct it.

**Dependencies:** Stage 3 (score state + review), Stage 1 (board-state model).

**Validation / acceptance.**
- The app can capture a board photo on-device without any network upload.
- The user can select a region of a captured photo.
- The recognition interface can return "cannot interpret," and that path cleanly offers manual entry.
- A proposed result is never reflected in committed totals until the user confirms it.
- Confirming a proposed result commits it; rejecting it leaves committed totals unchanged.

**Vision trace:** G2 (foundation), G4, G5, principles 4/5, features 4.2, 4.6, 5.3 (recognition layer, proposed/committed).

---

## Stage 7 — Photo-based feature scoring

**Goal:** Photograph a completed structure (or selected region) and receive a correct, reviewable score that can be applied to the scoreboard.

The first real automation payoff, delivered behind the Stage 6 review boundary.

**Deliverables:**
- **Single-feature recognition:** turn a photo of a completed city, road, or monastery (or a user-selected region) into the board state needed to score that feature.
- **Feature scoring from photo:** run the Stage 1/Stage 5 engine over the recognised feature to compute its score.
- **Reviewable result:** show the recognised feature, its computed score, and which meeples/players it credits, before applying.
- **Apply to scoreboard:** on confirmation, the feature's score is committed as a normal logged score event (so it remains reviewable/reversible via Stage 3).
- **Clear failure + fallback:** if the photo cannot be interpreted, say so plainly and offer manual entry for that feature.

**Dependencies:** Stage 6, Stage 5 (scoring coverage), Stage 4 (engine maturity).

**Validation / acceptance.**
- For a clearly photographed completed feature, the app proposes the correct score and the correct crediting of meeples/players.
- The proposed result must be confirmed before it affects committed totals.
- A confirmed photo score appears in the event log and is reversible like any manual entry.
- An uninterpretable photo yields a clear message and a manual-entry fallback — never a fabricated score.
- A reviewable result is produced "in seconds" for a typical feature (performance NFR).

**Vision trace:** G2, G4, G5, features 4.2, 4.6, success phase "Feature scoring".

---

## Stage 8 — Photo-based final scoring

**Goal:** Photograph the finished board and produce the complete end-of-game tally automatically — including farmers — fully reviewable before it becomes official.

The most ambitious recognition stage: whole-board interpretation feeding the full end-game engine from Stage 4.

**Deliverables:**
- **Full-board recognition:** turn a photo (or set of photos) of the finished board into a complete board state.
- **Full final scoring from photo:** run the Stage 4/Stage 5 end-game engine — incomplete cities/roads, monasteries, and **farmer/field scoring** across the whole board — over the recognised state.
- **Per-player breakdown:** present the complete computed final score decomposed per player and per category for verification.
- **Whole-result review:** the entire computed final tally is presented for human review and correction before it becomes the official result.
- **Partial-recognition handling:** where parts of the board cannot be interpreted, those parts fail loudly and drop to manual entry while the rest is still computed.

**Dependencies:** Stage 7 (recognition + review pattern), Stage 4 (final/farmer engine), Stage 5 (expansion coverage).

**Validation / acceptance.**
- For a clearly photographed finished base-game board, the app produces a complete final tally, including correct farmer scoring.
- The full computed result is shown per-player and per-category and can be corrected before finalising.
- No computed final result becomes official without explicit human confirmation.
- Unrecognised regions are flagged and routed to manual entry rather than guessed.

**Vision trace:** G1, G2, G4, G5, features 4.3, 4.6, success phase "Final scoring".

---

## Stage 9 — Board validation

**Goal:** Detect illegal tile placements and configurations and report them clearly for human judgement — assist and flag, never override.

The final maturity step, layered on the recognised/known board state.

**Deliverables:**
- **Validation engine:** platform-independent logic that checks a board state against the catalog for illegal placements and configurations (edge mismatches, illegal adjacencies, invalid meeple placements).
- **Validation from recognised or known state:** run validation over board state from recognition (Stage 8) or otherwise known state.
- **Clear reporting:** for each flagged issue, explain *what* appears wrong and *where*, so players can judge whether it is a real violation or a recognition error.
- **Advisory only:** flags are surfaced for human decision; the app never auto-corrects or overrides players.
- **Validation test suite:** legal and illegal configurations across base game and supported expansions.

**Dependencies:** Stage 1 (catalog/board state), Stage 8 (recognised full-board state), Stage 5 (expansion rules).

**Validation / acceptance.**
- The validation engine correctly flags canonical illegal configurations and passes legal ones, verified by automated tests.
- Each flag identifies what is wrong and where in terms a player can act on.
- Validation never modifies the score or the board on its own — it only reports.
- Recognition-induced false positives are presented as "review this," consistent with human-in-the-loop.

**Vision trace:** G4, G5, principle 4/5, features 4.4, 5.3 (validation engine), success phase "Validation".

---

## Cross-stage notes

- **Native mobile** (vision §5.2) is intentionally **not** its own stage here. The platform-independent core (Stages 1, 4, 5) is built so a native target can reuse it later; that effort will be added as a new stage when prioritised, after the web maturity curve is complete.
- **Accessibility, performance, and privacy** NFRs are not deferred to a single stage — they are embedded in the acceptance criteria of the stages where they first apply (colour-blind-safe colours in Stage 2, durability in Stage 3, on-device/no-upload in Stage 6, "seconds" in Stage 7).
- **Spec-first discipline:** each stage is implemented via the AIDE work-item workflow; this roadmap defines *what* and *in what order*, not the per-feature specs.

---

## Maintenance

Started stages (anything but 📋 in [`progress.md`](./progress.md)) are frozen — see `.aide/conventions/1-format-contract/roadmap.md`. New or changed scope enters as a new stage appended after the last, via `/aide-create-roadmap`; an unclaimed acceptance criterion is reworded only with `python .aide/scripts/aide.py progress reword`.
