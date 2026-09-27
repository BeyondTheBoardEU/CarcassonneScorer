<!-- aide-template: roadmap 1 -->
# Carcassonne Scorer — Development Roadmap

> **Status:** Active · **Created:** 2026-06-14 · **Last updated:** 2026-09-27 (prototype-posture review: recognition foundation folded into photo feature scoring; stages renumbered 1–8)
> Step 2 of the AIDE loop · derived from [`vision.md`](vision.md) (posture: prototype) · its stages
> are mirrored by [`progress.md`](progress.md) and scoped into the queues.

---

## Strategy

Each **stage** delivers a demonstrable, testable version of the product that builds on the stages before it, deployable locally and sized for roughly a week. Under the vision's **prototype** posture a stage exists only where a success criterion needs one — no preparatory or "for later" stages.

The sequence follows the vision's maturity curve: first a scorepad that fully replaces pen and paper (Stages 1–5: core, manual scorepad, offline durability and review, end-game tally, expansions), then photo-based scoring (Stages 6–7), then board validation (Stage 8). The vision's principles hold from the start: a **single tile catalog** drives everything (Stage 1), the **core is platform-independent** (Stages 1, 4, 5), the **running score is never lost and works offline** (Stages 2–3), **automation is always reviewable** (the proposed/committed boundary arrives with the first recognition, Stage 6), and **unsupported input fails loudly** (Stages 5–8).

Each stage lists its **Goal**, **Deliverables**, **Dependencies**, **Validation / acceptance** (mirrored as `progress.md` acceptance boxes; a measured outcome is a `Target:` bullet instead), and a **Vision trace**.

### Stage map

| Stage | Title | Maturity phase | Outcome |
|-------|-------|----------------|---------|
| 1 | Foundation: tile catalog + scoring engine core | Scorepad | Platform-independent core that scores base-game features from board state, unit-tested. |
| 2 | Manual scorepad MVP (base game) | Scorepad | Installable-track web app: set up a game, enter scores, see live totals, persisted locally. |
| 3 | Offline durability + review & correction | Scorepad | PWA installable & offline; score log is reviewable and reversible; no state ever lost. |
| 4 | End-game tally assistant incl. farmers | Scorepad | Guided final scoring, including manual farmer/field scoring, with per-player breakdown. |
| 5 | Expansion coverage (major expansions) | Scorepad | Catalog + scoring extended to the major expansions; coverage that scores correctly. |
| 6 | Photo-based feature scoring | Feature scoring | Photograph a completed structure or selected region, review the proposed score, and commit or reject it. |
| 7 | Photo-based final scoring | Final scoring | Photograph the finished board, get the complete reviewable end-game tally incl. farmers. |
| 8 | Board validation | Validation | Detect and clearly report illegal placements/configurations for human judgement. |

### Objective → stage coverage

Derived from each stage's **Vision trace** line below.

| Objective | Delivered by |
|-----------|--------------|
| G1 Eliminate manual tallying | Stages 2, 4, 7 |
| G2 Fast, correct scoring from a photo | Stages 6, 7 |
| G3 Never lose the running score | Stages 2, 3 |
| G4 Trustworthy automation | Stages 3, 4, 6, 7, 8 |
| G5 Graceful degradation | Stages 5, 6, 7, 8 |
| G6 Broad coverage | Stages 1, 2, 5 |

### Stage dependency graph

```
1 ─► 2 ─► 3 ─► 4 ─► 5 ─► 6 ─► 7 ─► 8
```

(Stage 4 also needs Stage 1; Stages 6–8 also draw on Stages 4–5 — see each stage's Dependencies.)

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

**Vision trace:** G6; principles 1/2/6; features 5.1 (foundation), 5.5; architecture §6 (core).

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

**Vision trace:** G1, G3 (first cut), G6 (player counts/colours); feature 5.1; constraint "accessibility"; architecture §6 (web, persistence).

---

## Stage 3 — Offline durability + review & correction

**Goal:** Make the scorepad installable and fully offline, and make every score change reviewable and reversible so nothing is final until the game ends.

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

**Vision trace:** G3, G4 (review); principle 3; feature 5.1; success criteria 3, 8.

---

## Stage 4 — End-game tally assistant including farmers

**Goal:** Guide players through the end-of-game final scoring — the part they most dislike — including manual farmer/field scoring, with a verifiable per-player breakdown.

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

**Vision trace:** G1, G4; features 5.1 (end-game tally), 5.3 (farmer logic, manual precursor); success criterion 1; phase "Scorepad".

---

## Stage 5 — Expansion coverage (major expansions)

**Goal:** Extend the catalog and scoring engine to the major/common expansions so coverage holds up under enthusiast play.

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

**Vision trace:** G5, G6; principles 2/5; features 5.5, 5.6; success criterion 6.

---

## Stage 6 — Photo-based feature scoring

**Goal:** Photograph a completed structure (or a selected region) on-device and receive a correct, reviewable score that is committed to the scoreboard only when a human confirms it.

The first automation payoff. It introduces the camera and the proposed-vs-committed boundary together, so no automated result is ever trusted before the review step exists.

**Deliverables:**
- **Photo capture:** capture an image of the board (or part of it) from the device camera, on-device, with no upload.
- **Region selection:** let the user indicate a region of the photo (draw/tap-to-select) to constrain what gets scored.
- **Single-feature recognition:** turn a photo of a completed city, road, or monastery (or the selected region) into the board state needed to score it, or report explicitly that it cannot.
- **Feature scoring from photo:** run the Stage 1/Stage 5 engine over the recognised feature.
- **Proposed vs committed score:** the score model separates *proposed* results from *committed* ones; the review flow shows the recognised feature, its computed score and credited meeples/players, and the user confirms (commit as a normal logged score event, reviewable/reversible via Stage 3) or rejects/corrects it.
- **Clear failure + fallback:** an uninterpretable photo says so plainly and offers manual entry for that feature.

**Dependencies:** Stage 3 (score state + review), Stage 4 (engine maturity), Stage 5 (scoring coverage).

**Validation / acceptance.**
- The app captures a board photo on-device without any network upload.
- The user can select a region of a captured photo.
- For a clearly photographed completed feature, the app proposes the correct score and the correct crediting of meeples/players.
- A proposed result is never reflected in committed totals until the user confirms it; rejecting it leaves committed totals unchanged.
- A confirmed photo score appears in the event log and is reversible like any manual entry.
- An uninterpretable photo yields a clear message and a manual-entry fallback — never a fabricated score.
- Target: a reviewable result is produced within seconds for a typical feature photo.

**Vision trace:** G2, G4, G5; principles 4/5; features 5.2, 5.6; constraint "privacy"; success criteria 2, 4, 5; phase "Feature scoring".

---

## Stage 7 — Photo-based final scoring

**Goal:** Photograph the finished board and produce the complete end-of-game tally automatically — including farmers — fully reviewable before it becomes official.

**Deliverables:**
- **Full-board recognition:** turn a photo (or set of photos) of the finished board into a complete board state.
- **Full final scoring from photo:** run the Stage 4/Stage 5 end-game engine — incomplete cities/roads, monasteries, and **farmer/field scoring** across the whole board — over the recognised state.
- **Per-player breakdown:** present the complete computed final score decomposed per player and per category for verification.
- **Whole-result review:** the entire computed final tally is presented for human review and correction before it becomes the official result.
- **Partial-recognition handling:** where parts of the board cannot be interpreted, those parts fail loudly and drop to manual entry while the rest is still computed.

**Dependencies:** Stage 6 (recognition + review pattern), Stage 4 (final/farmer engine), Stage 5 (expansion coverage).

**Validation / acceptance.**
- For a clearly photographed finished base-game board, the app produces a complete final tally, including correct farmer scoring.
- The full computed result is shown per-player and per-category and can be corrected before finalising.
- No computed final result becomes official without explicit human confirmation.
- Unrecognised regions are flagged and routed to manual entry rather than guessed.

**Vision trace:** G1, G2, G4, G5; features 5.3, 5.6; success criteria 1, 2, 4, 5; phase "Final scoring".

---

## Stage 8 — Board validation

**Goal:** Detect illegal tile placements and configurations and report them clearly for human judgement — assist and flag, never override.

**Deliverables:**
- **Validation engine:** platform-independent logic that checks a board state against the catalog for illegal placements and configurations (edge mismatches, illegal adjacencies, invalid meeple placements).
- **Validation from recognised or known state:** run validation over board state from recognition (Stage 7) or otherwise known state.
- **Clear reporting:** for each flagged issue, explain *what* appears wrong and *where*, so players can judge whether it is a real violation or a recognition error.
- **Advisory only:** flags are surfaced for human decision; the app never auto-corrects or overrides players.
- **Validation test suite:** legal and illegal configurations across base game and supported expansions.

**Dependencies:** Stage 1 (catalog/board state), Stage 7 (recognised full-board state), Stage 5 (expansion rules).

**Validation / acceptance.**
- The validation engine correctly flags canonical illegal configurations and passes legal ones, verified by automated tests.
- Each flag identifies what is wrong and where in terms a player can act on.
- Validation never modifies the score or the board on its own — it only reports.
- Recognition-induced false positives are presented as "review this," consistent with human-in-the-loop.

**Vision trace:** G4, G5; principles 2/4/5; features 5.4; success criterion 7; phase "Validation".

---

## Cross-stage notes

- **Native mobile apps** are out of scope for now (vision §8); the platform-independent core keeps the option open.
- **Accessibility and privacy constraints** (vision §7) are embedded in the acceptance criteria where they first apply: colour-not-alone meeple colours in Stage 2, on-device/no-upload capture in Stage 6.

---

## Maintenance

Started stages (anything but 📋 in [`progress.md`](./progress.md)) are frozen — see `.aide/conventions/1-format-contract/roadmap.md`. New or changed scope enters as a new stage appended after the last, via `/aide-create-roadmap`; an unclaimed acceptance criterion is reworded only with `python .aide/scripts/aide.py progress reword`.
