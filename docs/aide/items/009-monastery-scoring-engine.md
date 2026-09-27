# Item 009 — Monastery scoring and engine assembly

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-20

---

## Description

Implement **monastery scoring** — a **completed** monastery (its tile plus all **8** surrounding tiles present) scores **9 points** to its owner — and assemble the per-feature scorers behind a single **scoring-engine entry point**: `scoreBoard(board, catalog)` takes a board state and returns all completed-feature scores plus a per-player total.

This is the capstone of the Stage 1 scoring engine. Items 006/007/008 built the pieces (feature extraction, ownership, city/road scoring); this item adds the last per-feature scorer (monastery) and wires extraction → per-feature scoring → per-player tally into one call that the rest of the product (Stage 2 scorepad, later photo-based scoring) drives.

### Scope boundary

- **Completed features only (incremental).** The engine scores **completed** cities, roads, and monasteries — the in-game rule. **Incomplete** features and **fields/farmers** are **end-game scoring (Stage 4)** and out of scope. A completed monastery needs **all 8** neighbours present (Item 006 already computes this in `Feature.completed`).
- **Reuse, don't reimplement.** Use `extractFeatures` (Item 006), `resolveOwnership` (Item 007), and the city/road scorers + `FeatureScore` shape (Item 008). Do not re-derive connectivity, completion, point math, or majority. This item adds only the monastery scorer and the assembly/tally.
- **No game roster.** The board state has no player list (players are Stage 2 setup). Per-player totals are derived solely from the players credited by completed features (see below).

## Design decisions (decided here)

- **Monastery scorer.** `scoreMonastery(feature: Feature): FeatureScore`, pure. A completed monastery scores a **flat 9** points (`points: 9`) — not 9×tiles; the monastery `Feature` spans one tile (`tilePositions.length === 1`) and `completed` already encodes the 8-neighbour rule. Credited `players = resolveOwnership(feature.meeples).owners` (a monk; ties are not expected on a single-tile monastery but are handled generically). `pennants: 0`, `tileCount: 1`.
- **Unified completed-feature scorer.** Extend the Item 008 aggregator into `scoreCompletedFeatures(features: readonly Feature[]): FeatureScore[]` that returns a `FeatureScore` for every **completed** `city`/`road`/`monastery` feature (reusing `scoreCity`/`scoreRoad`/`scoreMonastery`), skipping incomplete features and fields, in Item 006's deterministic order. The Item 008 city/road aggregator may be kept or folded into this.
- **Engine entry point.** `scoreBoard(board: BoardState, catalog: Catalog): BoardScore` = `extractFeatures(board, catalog)` → `scoreCompletedFeatures(...)` → tally. Pure; no I/O.
- **`BoardScore` shape.**
  - `features: FeatureScore[]` — all completed scored features (city/road/monastery), deterministic order.
  - `playerTotals: Record<string, number>` — per-player summed points: for each `FeatureScore`, add its `points` to **each** id in `players` (tie ⇒ each tied player gets the full feature value). Keys are exactly the players credited by ≥1 completed feature; a player never credited is **absent** (callers wanting a full roster default missing ids to 0). An unowned completed feature (`players: []`) contributes its points to nobody.
- **`FeatureType` now includes monastery in scored output.** The Item 008 `FeatureScore.type` union already allows `"monastery"`; this item populates it.
- **Determinism.** `features` order follows Item 006; `playerTotals` is an id-keyed object (order irrelevant); results are independent of board input order.

## Proposed types (shape, not final names)

```ts
interface BoardScore {
  features: FeatureScore[];               // completed city/road/monastery scores, deterministic order
  playerTotals: Record<string, number>;   // per-player summed points (credited players only)
}

function scoreMonastery(feature: Feature): FeatureScore;
function scoreCompletedFeatures(features: readonly Feature[]): FeatureScore[];
function scoreBoard(board: BoardState, catalog: Catalog): BoardScore;
```

Exact file layout may vary — e.g. add `packages/core/src/scoring/monastery.ts` and `packages/core/src/scoring/engine.ts` (or extend `feature-score.ts`) alongside Items 007/008, re-exported via `scoring/index.ts` and `packages/core/src/index.ts`.

## Acceptance criteria

- [x] `scoreMonastery`, `scoreBoard`, the `BoardScore` type, and a unified `scoreCompletedFeatures` aggregator are implemented in the `scoring/` module and **exported from `@carcassonne/core`**. Pure; no input mutation.
- [x] A **completed** monastery (tile + all 8 neighbours present) scores a flat **9** points, credited to its monk's owner; an **incomplete** monastery (≤7 neighbours) is **not** scored by the engine.
- [x] A completed monastery with **no meeple** yields `players: []` (worth 9, credited to nobody → contributes 0 to all totals).
- [x] `scoreBoard(board, catalog)` returns `features` containing exactly the **completed** city/road/monastery scores and `playerTotals` equal to the per-player sums of those features' `points` over their credited `players`.
- [x] On a **mixed board** (e.g. a completed city, a completed road, a completed monastery, plus some incomplete features), `features` lists only the completed ones with correct points/types/players, and `playerTotals` is correct per player.
- [x] **Tie** points flow through to totals: a contested completed feature credits each tied player the full feature value in `playerTotals`.
- [x] Output is deterministic and independent of board input order (verified by a shuffled-input test).
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–008) remain green; no new cyclic import.

> Maps to the Stage 1 deliverable "Scoring engine (base game, incremental): scores completed cities, roads, and monasteries, including majority/tie meeple ownership" (this completes it) and the engine-assembly goal. With this item the Stage 1 acceptance criteria **"Engine returns correct scores for completed cities, roads, and monasteries …"** and **"Contested features award points by official majority/tie rules"** are satisfied (Item 010 then hardens them with the comprehensive scenario suite). See Completion Reminder.

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/009/`.

## Implementation steps

1. Read `packages/core/src/features/types.ts` (`Feature`), `packages/core/src/scoring/{ownership,feature-score}.ts` (Item 007/008 APIs + `FeatureScore`), and the Item 006 monastery-completion fixtures in `feature-extraction.test.ts`.
2. Add `scoreMonastery` (flat 9, ownership via `resolveOwnership`).
3. Add `scoreCompletedFeatures` covering city/road/monastery (reuse Item 008 scorers); add `scoreBoard` (extract → score → tally) and the `BoardScore` type.
4. Re-export from `scoring/index.ts` and `packages/core/src/index.ts`.
5. Add `packages/core/test/engine.test.ts` (see strategy).
6. Run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** in `packages/core/test/engine.test.ts`, authoring boards with `createBoard()` + `baseGameCatalog`:
  - **Completed monastery:** a cloister tile with a monk and all 8 neighbours present → `scoreMonastery` / `scoreBoard` gives 9 points to that player. (Reuse the 8/8-neighbour fixture from `feature-extraction.test.ts`.)
  - **Incomplete monastery:** 7 neighbours → not in `features`, contributes 0.
  - **Monastery no meeple:** completed but unowned → `players: []`, 0 to all totals.
  - **`scoreBoard` mixed board:** at least two completed feature types (e.g. a closed city + a completed monastery, ideally + a closed road) with meeples of ≥2 players, plus an incomplete feature → assert `features` (types/points/players) and `playerTotals` exactly.
  - **Tie through totals:** a contested completed feature → both tied players' totals increase by the full feature value.
  - **Determinism:** same board built in different input order → deep-equal `scoreBoard` result.
  - **Empty board:** `scoreBoard` returns `{ features: [], playerTotals: {} }`.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 006 (`extractFeatures`, `Feature`, monastery completion), Item 007 (`resolveOwnership`), Item 008 (`scoreCity`/`scoreRoad`, `FeatureScore`). Reuse; do not modify their contracts.
- **Downstream:** Item 010 (canonical scenario suite drives `scoreBoard` end-to-end), Stage 2 (scorepad calls the engine), Stage 4 (end-game extends with incomplete-feature + farmer scoring), Stages 7/8 (photo-based scoring runs this engine over recognised state).

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config files, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (engine suite green; Items 001–008 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — `scoreMonastery`/`scoreBoard`/`BoardScore` exported; completed monastery = 9; engine returns completed city/road/monastery scores + per-player totals
- [x] Data verified — incomplete/field features excluded; tie credits both full in totals; empty board → empty result
- [x] Health checks pass — N/A

**Expected Outcomes**
- Monastery scorer + unified engine exported and pure; `scoreBoard` returns correct completed-feature scores and per-player totals for hand-authored boards.
- `npm run lint && npm run build && npm test` exits 0.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: N/A
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

- **Kept Item 008's `scoreCompletedCityRoadFeatures` in place** rather than removing or folding it into the new aggregator, to preserve backward compatibility with the existing `city-road-scoring.test.ts` suite. `scoreCompletedFeatures` in the new `scoring/engine.ts` is the unified aggregator that supersedes it for engine callers going forward and additionally covers monasteries; the older function remains as a narrower, still-valid alternative rather than dead code.
- **`scoreMonastery` lives in its own file**, `packages/core/src/scoring/monastery.ts`, mirroring the one-scorer-per-file pattern established by `city.ts`/`road.ts` in Item 008, rather than extending `feature-score.ts`. `BoardScore`, `scoreCompletedFeatures`, and `scoreBoard` live in a new `scoring/engine.ts`, matching the spec's suggested file layout.
- **No new cyclic imports introduced.** `engine.ts` imports from `../features/extract.js`, `../features/types.js`, `../catalog/types.js`, `../board/types.js`, and sibling `./feature-score.js`/`./monastery.js`; `monastery.ts` imports only `../features/types.js` and sibling `./ownership.js`/`./feature-score.js` (type-only). The dependency graph stays one-directional (board/catalog → features → scoring), confirmed by inspection and by the checker.
- **Monastery scoring is hardcoded to a flat 9 points and `tileCount: 1`**, independent of `feature.tilePositions.length`, since a monastery feature always spans exactly one tile and `Feature.completed` (from Item 006) already encodes the 8-neighbour rule — there was no need to derive the point value from tile count as cities/roads do.

## Completion Reminder

When complete, update [progress.md](../progress.md): mark the Stage 1 deliverable **"Scoring engine (base game, incremental): scores completed cities, roads, and monasteries, including majority/tie meeple ownership"** ✅ (Items 006–009 together deliver it), and **tick** the Stage 1 acceptance criteria **"Engine returns correct scores for completed cities, roads, and monasteries …"** and **"Contested features award points by official majority/tie rules"** (the engine + its tests now satisfy them). **Stage 1 stays 🚧 In Progress** — the "Comprehensive unit tests for canonical base-game scenarios" deliverable is still open until **Item 010**, which then flips Stage 1 → ✅. Do not mark Stage 1 complete in this item. Update only Item 009's progress. Status flow: 📋 → 🚧 → ✅.
