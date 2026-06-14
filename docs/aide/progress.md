# Carcassonne Scorer — Progress

> **Status:** Draft v1 · **Last updated:** 2026-06-14
> **Document role:** Step 3 of the AIDE workflow. Derived from [`vision.md`](./vision.md) and [`roadmap.md`](./roadmap.md). Tracks completion state per stage, deliverable, and acceptance criterion. The queue and work items draw from here. Scope changes happen in the vision first, then propagate to the roadmap, then here.

---

## Status legend

| Icon | Meaning |
|------|---------|
| 📋 | Planned — not started |
| 🚧 | In Progress |
| ✅ | Complete |
| ⏸️ | Deferred |
| ❌ | Excluded |

**Maintenance rule:** Never regress a status back to 📋. Add new items as they appear in the roadmap; do not delete items — mark removed scope ⏸️ Deferred with a note. Preserve all checked acceptance-criteria boxes.

---

## Overall progress

| Stage | Title | Maturity phase | Status |
|-------|-------|----------------|--------|
| 1 | Foundation: tile catalog + scoring engine core | Scorepad | 🚧 In Progress |
| 2 | Manual scorepad MVP (base game) | Scorepad | 📋 Planned |
| 3 | Offline durability + review & correction | Scorepad | 📋 Planned |
| 4 | End-game tally assistant incl. farmers | Scorepad | 📋 Planned |
| 5 | Expansion coverage (major expansions) | Scorepad | 📋 Planned |
| 6 | Recognition foundation: capture, regions, proposed/committed | Feature scoring | 📋 Planned |
| 7 | Photo-based feature scoring | Feature scoring | 📋 Planned |
| 8 | Photo-based final scoring | Final scoring | 📋 Planned |
| 9 | Board validation | Validation | 📋 Planned |

---

## Stage 1 — Foundation: tile catalog + scoring engine core

**Status:** 🚧 In Progress · **Maturity phase:** Scorepad · **Dependencies:** none
**Goal:** Platform-independent core that scores base-game features from board state, unit-tested.

### Deliverables
- ✅ Project scaffold separating a platform-independent **core** (no UI, no platform APIs) from everything else.
- 📋 **Tile catalog (base game):** data-driven definition of every base-game tile — edges (city/road/field/monastery segments) and carriable pieces/features — in one authoritative source format.
- 📋 **Board-state model:** representation of placed tiles, positions/orientations, and meeple placements, independent of how the state was produced.
- 📋 **Scoring engine (base game, incremental):** scores completed cities, roads, and monasteries, including majority/tie meeple ownership.
- 📋 Comprehensive unit tests for canonical base-game scenarios (single owner, contested/tied, pennants, monastery completion).
- 📋 Catalog-validation tests asserting internal consistency (edges match, no malformed tiles).

### Acceptance criteria
- [x] Core module has zero UI/platform dependencies and runs in isolation.
- [ ] Engine returns correct scores for completed cities, roads, and monasteries from a hand-authored board state (automated tests).
- [ ] Contested features award points by official majority/tie rules (tests).
- [ ] Base-game catalog passes internal-consistency checks.

**Vision trace:** G6; principles 1/2/6; features 4.1 (foundation), 4.5, 5.3.

---

## Stage 2 — Manual scorepad MVP (base game)

**Status:** 📋 Planned · **Maturity phase:** Scorepad · **Dependencies:** Stage 1
**Goal:** Usable web app to set up a base-game session and track scores by hand with live totals, persisted locally.

### Deliverables
- 📋 **Game setup:** 2–6 players, name + meeple colour from the standard set; colour selection does not rely on colour alone (label/pattern).
- 📋 **Manual score entry:** add or adjust points for any player at any time.
- 📋 **Score event log:** every change recorded as a traceable event (who, how many, when/why).
- 📋 **Running scoreboard:** always-visible current totals per player, readable at a glance.
- 📋 **Local persistence (first cut):** game state and event log saved to local storage; reload restores the in-progress game.
- 📋 Thin UI over the Stage 1 core; no scoring logic duplicated in the UI.

### Acceptance criteria
- [ ] Set up a 2–6 player game, name players, assign distinct meeple colours.
- [ ] Add/adjust points for any player; totals update immediately.
- [ ] Every score change appears in the event log.
- [ ] Reloading restores the exact in-progress game (players, totals, log).
- [ ] No scoring arithmetic in the UI — totals come from the core.

**Vision trace:** G1, G3 (first cut), G6; features 4.1, 5.3.

---

## Stage 3 — Offline durability + review & correction

**Status:** 📋 Planned · **Maturity phase:** Scorepad · **Dependencies:** Stage 2
**Goal:** Make the scorepad installable and fully offline; make every score change reviewable and reversible.

### Deliverables
- 📋 **PWA installability:** install (home-screen/standalone) and launch without a network.
- 📋 **Offline operation:** full scorepad functionality with no network, verified with network disabled.
- 📋 **Durability hardening:** state survives reload, crash/abrupt close, and device sleep; writes atomic enough that a partial write cannot corrupt the game.
- 📋 **Review & correction UI:** browse the score event log; edit or reverse any past entry with totals recomputing correctly.
- 📋 **Game lifecycle:** start a new game, end/finalise the current game, resume an unfinished game.

### Acceptance criteria
- [ ] App installs and opens with the network fully disabled and stays functional.
- [ ] Killing the app/tab mid-game and reopening restores it without loss or corruption.
- [ ] Any logged score event can be edited or reversed; totals reconcile correctly.
- [ ] A finished game can be finalised and a new game started without losing the ability to review the prior one (until explicitly cleared).

**Vision trace:** G3, G4 (review); principle 3; NFR reliability/offline; features 4.1, 4.6.

---

## Stage 4 — End-game tally assistant including farmers

**Status:** 📋 Planned · **Maturity phase:** Scorepad · **Dependencies:** Stage 1, Stage 3
**Goal:** Guide players through end-of-game final scoring, including manual farmer/field scoring, with a verifiable per-player breakdown.

### Deliverables
- 📋 **Final-scoring engine (base game):** end-game scoring of incomplete cities/roads, monasteries, and **farmer/field scoring** (fields scored by completed bordering cities, with field-majority ownership), unit-tested.
- 📋 **Guided end-game flow:** step-by-step UI walking the scorekeeper through each end-game category to confirm or enter values per feature.
- 📋 **Per-player breakdown:** final total decomposed by category (completed, incomplete, monasteries, farmers).
- 📋 **Finalised result:** reviewed end-game tally becomes the official final scoreboard.

### Acceptance criteria
- [ ] Final-scoring engine computes farmer/field scores correctly for canonical layouts (automated tests).
- [ ] User can run the guided end-game flow to completion and produce a final scoreboard.
- [ ] Final total shown broken down per player and per category.
- [ ] User can correct any end-game value before finalising.

**Vision trace:** G1, G4; features 4.1 (end-game tally), 4.3 (farmer logic, manual precursor); success phase "Scorepad".

---

## Stage 5 — Expansion coverage (major expansions)

**Status:** 📋 Planned · **Maturity phase:** Scorepad · **Dependencies:** Stage 1, Stage 4
**Goal:** Extend catalog and scoring engine to the major/common expansions so coverage holds up under enthusiast play.

### Deliverables
- 📋 **Defined supported set:** explicit list of targeted major expansions (recorded here and in the catalog); anything outside is unsupported.
- 📋 **Catalog extension:** targeted expansions' tiles/pieces added to the single catalog in the same authoritative format.
- 📋 **Scoring rules per expansion:** incremental and end-game rules per supported expansion in the core engine.
- 📋 **Setup support:** game setup lets players enable the expansions in play.
- 📋 **Expanded test suite:** scoring scenarios per expansion, including interactions with base-game scoring.
- 📋 **Loud failure for unsupported pieces:** anything outside the supported set is clearly flagged, never silently mis-scored.

### Acceptance criteria
- [ ] Supported-expansion set is explicitly documented.
- [ ] Each supported expansion's tiles exist in the single catalog and pass consistency checks.
- [ ] Incremental and end-game scoring per supported expansion are correct (automated tests).
- [ ] Enabling expansions at setup changes scoring behaviour accordingly.
- [ ] An unsupported piece produces a clear "not supported" signal, never a silent guess.

**Vision trace:** G5, G6; principles 2/5; features 4.5, 4.6.

---

## Stage 6 — Recognition foundation: capture, regions, proposed/committed boundary

**Status:** 📋 Planned · **Maturity phase:** Feature scoring · **Dependencies:** Stage 3, Stage 1
**Goal:** Introduce the camera and the proposed-vs-committed boundary, with capture and region selection feeding a board-state model — before any automated interpretation is trusted.

### Deliverables
- 📋 **Photo capture:** capture an image of the board (or part) from the device camera, on-device, no upload.
- 📋 **Region selection UI:** indicate a region (draw/tap-to-select) to constrain what gets scored.
- 📋 **Recognition-layer interface:** defined boundary taking an image (+ optional region) and returning a partial board state or explicit "cannot interpret." Initial impl may stub to manual entry.
- 📋 **Proposed vs committed score:** score-state model gains a clear separation between *proposed* and *committed* results; nothing automated commits without explicit human confirm.
- 📋 **Review-and-apply flow shell:** UI flow showing a proposed result with confirm (commit) or reject/correct.

### Acceptance criteria
- [ ] App captures a board photo on-device with no network upload.
- [ ] User can select a region of a captured photo.
- [ ] Recognition interface can return "cannot interpret," and that path cleanly offers manual entry.
- [ ] A proposed result is never in committed totals until the user confirms it.
- [ ] Confirming commits; rejecting leaves committed totals unchanged.

**Vision trace:** G2 (foundation), G4, G5; principles 4/5; features 4.2, 4.6, 5.3.

---

## Stage 7 — Photo-based feature scoring

**Status:** 📋 Planned · **Maturity phase:** Feature scoring · **Dependencies:** Stage 6, Stage 5, Stage 4
**Goal:** Photograph a completed structure (or selected region) and receive a correct, reviewable score that can be applied to the scoreboard.

### Deliverables
- 📋 **Single-feature recognition:** turn a photo of a completed city/road/monastery (or selected region) into the board state needed to score it.
- 📋 **Feature scoring from photo:** run the Stage 1/Stage 5 engine over the recognised feature.
- 📋 **Reviewable result:** show recognised feature, computed score, and credited meeples/players before applying.
- 📋 **Apply to scoreboard:** on confirmation, committed as a normal logged score event (reviewable/reversible via Stage 3).
- 📋 **Clear failure + fallback:** uninterpretable photo says so plainly and offers manual entry for that feature.

### Acceptance criteria
- [ ] For a clearly photographed completed feature, the app proposes the correct score and correct meeple/player crediting.
- [ ] Proposed result must be confirmed before it affects committed totals.
- [ ] A confirmed photo score appears in the event log and is reversible like any manual entry.
- [ ] An uninterpretable photo yields a clear message and manual-entry fallback — never a fabricated score.
- [ ] A reviewable result is produced "in seconds" for a typical feature.

**Vision trace:** G2, G4, G5; features 4.2, 4.6; success phase "Feature scoring".

---

## Stage 8 — Photo-based final scoring

**Status:** 📋 Planned · **Maturity phase:** Final scoring · **Dependencies:** Stage 7, Stage 4, Stage 5
**Goal:** Photograph the finished board and produce the complete end-of-game tally automatically — including farmers — fully reviewable before it becomes official.

### Deliverables
- 📋 **Full-board recognition:** turn a photo (or set of photos) of the finished board into a complete board state.
- 📋 **Full final scoring from photo:** run the Stage 4/Stage 5 end-game engine — incomplete cities/roads, monasteries, and **farmer/field scoring** across the whole board — over the recognised state.
- 📋 **Per-player breakdown:** complete computed final score decomposed per player and per category.
- 📋 **Whole-result review:** entire computed final tally presented for human review and correction before it becomes official.
- 📋 **Partial-recognition handling:** unreadable parts fail loudly and drop to manual entry while the rest is computed.

### Acceptance criteria
- [ ] For a clearly photographed finished base-game board, the app produces a complete final tally including correct farmer scoring.
- [ ] Full computed result shown per-player and per-category and correctable before finalising.
- [ ] No computed final result becomes official without explicit human confirmation.
- [ ] Unrecognised regions are flagged and routed to manual entry, not guessed.

**Vision trace:** G1, G2, G4, G5; features 4.3, 4.6; success phase "Final scoring".

---

## Stage 9 — Board validation

**Status:** 📋 Planned · **Maturity phase:** Validation · **Dependencies:** Stage 1, Stage 8, Stage 5
**Goal:** Detect illegal tile placements and configurations and report them clearly for human judgement — assist and flag, never override.

### Deliverables
- 📋 **Validation engine:** platform-independent logic checking a board state against the catalog for illegal placements/configurations (edge mismatches, illegal adjacencies, invalid meeple placements).
- 📋 **Validation from recognised or known state:** run validation over board state from recognition (Stage 8) or otherwise known state.
- 📋 **Clear reporting:** for each flagged issue, explain *what* appears wrong and *where*.
- 📋 **Advisory only:** flags surfaced for human decision; never auto-correct or override.
- 📋 **Validation test suite:** legal and illegal configurations across base game and supported expansions.

### Acceptance criteria
- [ ] Validation engine correctly flags canonical illegal configurations and passes legal ones (automated tests).
- [ ] Each flag identifies what is wrong and where, in terms a player can act on.
- [ ] Validation never modifies the score or board on its own — it only reports.
- [ ] Recognition-induced false positives are presented as "review this," consistent with human-in-the-loop.

**Vision trace:** G4, G5; principles 4/5; features 4.4, 5.3; success phase "Validation".

---

## Cross-cutting / deferred items

- ⏸️ **Native mobile apps** (vision §5.2) — intentionally not a stage in the current roadmap. The platform-independent core (Stages 1, 4, 5) is built so a native target can reuse it later; to be added as a stage when prioritised, after the web maturity curve is complete.
- **Accessibility / performance / privacy NFRs** — not a separate stage; embedded in the acceptance criteria where they first apply (colour-blind-safe colours in Stage 2, durability in Stage 3, on-device/no-upload in Stage 6, "seconds" in Stage 7).

---

## Next Step

Review this progress file. When you're ready, start a **new chat session** and run `/speckit.aide.create-queue` to generate the first batch of prioritized work items.
