# Carcassonne Scorer — Work Queue 001

> **Status:** Active · **Created:** 2026-06-14
> **Document role:** Step 4 of the AIDE workflow. Derived from [`vision.md`](../vision.md), [`roadmap.md`](../roadmap.md), and [`progress.md`](../progress.md). A prioritized batch of the next ~10 actionable work items. Each item is testable locally and the batch is sized for roughly a week.

---

## Scope of this queue

This is the **first** queue. All roadmap stages are 📋 Planned, so this batch fully addresses **Stage 1 — Foundation: tile catalog + scoring engine core**. Stage 1 builds no UI; it establishes the architectural spine the entire product depends on (single tile catalog + platform-independent scoring core) and proves it with automated tests.

The items are ordered so each builds on the last: scaffold → data models → catalog → feature extraction → ownership rules → per-feature scoring → comprehensive test suite. Completing all ten satisfies every Stage 1 deliverable and acceptance criterion.

**Vision trace for this batch:** G6; principles 1 (spec-first), 2 (single catalog), 6 (platform-independent core); features 4.1 (foundation), 4.5 (coverage/catalog), 5.3 (catalog + scoring engine).

---

## Work items

### Item 001: Project scaffold with platform-independent core
Set up the repository structure with a strict separation between a platform-independent **core** module (no UI, no platform/DOM/Node-only APIs) and the rest of the project. Establish the language/toolchain, the test runner, linting/formatting, and a build/test script that runs the core suite in isolation. Add a single trivial "smoke" test that imports the core and asserts it loads with zero UI/platform dependencies. Deliverable: a clean, runnable project where `test` executes and passes. (Stage 1 deliverable: project scaffold; acceptance: core runs in isolation with no UI/platform deps.)

### Item 002: Board-state model
Define the data structures that represent a placed-tile board: a tile placement (which catalog tile, its position on a coordinate grid, its orientation/rotation), and meeple placements (which player, on which tile, on which feature segment). The model must be independent of how the state was produced (manual now, recognition later) and serializable. Include constructor/builder helpers for authoring board states by hand in tests. Deliverable: typed, documented board-state model with unit tests covering construction and serialization round-trip. (Stage 1 deliverable: board-state model.)

### Item 003: Tile catalog format and schema
Design the single authoritative catalog format that defines a tile: its four edges (and any internal segments) typed as city / road / field / monastery, how segments connect across the tile interior (e.g. which field borders which city, whether a road passes through), pennants, and which features can carry a meeple. Specify it as data (not code) plus a typed loader in the core. Document the format so expansions can later be added in the same shape. Deliverable: catalog schema + loader + a couple of hand-written sample tiles with loader tests. (Stage 1 deliverable: catalog source format; principle 2.)

### Item 004: Base-game tile catalog data
Author the complete base-game tile set in the Item 003 format: every distinct base-game tile, its edge/segment definitions, interior connections, pennants, and meeple-able features. (Tile counts/multiplicity may be recorded but are not required for scoring from an explicit board state.) Deliverable: the full base-game catalog as data, loadable by the core. (Stage 1 deliverable: tile catalog — base game.)

### Item 005: Catalog-consistency validation tests
Write automated tests that assert the base-game catalog is internally consistent: every edge has a valid type, interior segment connections are well-formed and symmetric, no tile references an undefined feature, pennants attach only to city segments, and there are no malformed/duplicate tile definitions. These tests guard the single-catalog discipline against drift. Deliverable: a passing catalog-validation test suite. (Stage 1 deliverable: catalog-validation tests; acceptance: base-game catalog passes internal-consistency checks.)

### Item 006: Feature extraction from board state
Implement the core logic that walks a board state plus the catalog and groups connected tile segments into discrete **features**: cities, roads, monasteries, and fields. For each feature, determine its constituent segments, whether it is **completed** (closed city, road ended on both sides, monastery surrounded by 8 neighbours), and which meeples sit on it. This is the shared substrate all scoring builds on. Deliverable: feature-extraction function with unit tests over hand-authored boards (open vs closed cities/roads, an isolated vs surrounded monastery). (Stage 1 deliverable: foundation for scoring engine.)

### Item 007: Meeple ownership and majority/tie resolution
Implement the rule that decides which player(s) score a feature: count meeples per player on a feature, determine the majority owner, and handle ties (all tied players score the feature in full). Expose this as a reusable function consumed by every feature-scoring path. Deliverable: ownership/majority resolver with unit tests for single owner, clear majority, two-way tie, and three-way tie. (Stage 1 deliverable: majority/tie meeple ownership; acceptance: contested features award points by official rules.)

### Item 008: City and road incremental scoring
Implement scoring for **completed** cities and roads from board state, using feature extraction (Item 006) and ownership (Item 007): cities score 2 points per tile plus 2 per pennant; roads score 1 point per tile; credited to the majority owner(s). Return a structured result (per feature: type, points, credited players) suitable for later review/breakdown UIs. Deliverable: city + road scoring with unit tests including pennants and contested features. (Stage 1 deliverable: scoring engine — cities, roads.)

### Item 009: Monastery scoring and engine assembly
Implement monastery scoring (a completed monastery — its tile plus all 8 surrounding tiles present — scores 9 points to its owner) and assemble the per-feature scorers behind a single **scoring engine** entry point that takes a board state and returns all completed-feature scores with a per-player total. Deliverable: monastery scoring plus a unified `scoreBoard`-style API with unit tests for completed vs incomplete monasteries and a mixed board. (Stage 1 deliverable: scoring engine — monasteries; engine assembly.)

### Item 010: Canonical scoring scenario test suite
Build a comprehensive, named test suite of canonical base-game scoring scenarios that exercises the full engine end to end: single-owner city/road/monastery, contested and tied features, multi-pennant cities, a fully completed mixed board, and edge cases (feature spanning many tiles, two separate features of the same type). This suite is the regression safety net for all later stages. Deliverable: a documented scenario suite, all passing, that demonstrably satisfies the Stage 1 acceptance criteria. (Stage 1 deliverable: comprehensive unit tests; acceptance: engine returns correct scores from hand-authored board states.)

---

## Completion check

When all ten items are complete, **Stage 1** is done: the platform-independent core has zero UI/platform dependencies, the single base-game catalog passes consistency checks, and the scoring engine correctly scores completed cities, roads, and monasteries (including pennants and majority/tie ownership) from hand-authored board states — all verified by automated tests.

---

## Next Step

Select an item from this queue (start with **Item 001**) and open a **new chat session**. Run `/speckit.aide.create-item` with the item description to produce a detailed work-item specification. When this queue is exhausted, run `/speckit.aide.create-queue` again to generate `queue-002.md` starting at Item 011.
