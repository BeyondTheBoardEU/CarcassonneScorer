# Item 006 — Feature extraction from board state

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-20

---

## Description

Implement the core logic that walks a **board state** (Item 002) together with the **catalog** (Items 003/004) and groups connected tile segments into discrete **features**: cities, roads, monasteries, and fields. For each feature, determine its constituent segments, the tiles it spans, whether it is **completed**, and which meeples sit on it.

This is the **shared substrate every scoring path builds on.** Item 007 (ownership/majority) consumes a feature's meeples; Items 008/009 (city/road/monastery scoring) consume a feature's `type`, tile span, pennants, and `completed` flag. Getting connectivity and completion right here is what makes those later items thin.

This is pure, platform-independent TypeScript in `packages/core`. It reads board state + catalog and returns data; it computes **no points** and resolves **no ownership** (those are Items 007–009), and it does **not** validate board legality (edge-match/adjacency legality is **Stage 9** and is explicitly out of scope — see Scope boundary).

### Scope boundary

- **No scoring.** Feature extraction returns feature *structure*, not points. Points (2/tile + 2/pennant for cities, 1/tile for roads, 9 for monasteries) are Items 008/009.
- **No ownership resolution.** Extraction *collects* the meeples sitting on each feature; deciding *who scores* (majority/tie) is Item 007. The output must carry enough meeple detail (player + segment ref) for Item 007 to resolve without re-walking the board.
- **No board-legality validation.** Extraction assumes inputs are **legal** boards. It connects only segments of the **same feature type** across a shared edge; if a neighbour's touching side is a different type (an illegal placement), extraction simply does not connect there — it does **not** raise a validation error. Detecting/reporting illegal placements is Stage 9.
- **No fields scoring rules.** Fields are *grouped* (and their farmers attached) here so the substrate is complete, but field/farmer **scoring** is Stage 4. A field has no completion concept (see below).

## Design decisions (decided here)

- **Inputs: `BoardState` + `Catalog`.** A single entry point `extractFeatures(board, catalog): Feature[]`. Pure function, no I/O, no mutation of inputs. Tiles are resolved via `catalog.getTile(placement.tileId)`. An unknown tile id propagates the existing `CatalogError` from `getTile` (board ids are assumed to exist in the catalog — consistent with the Item 002 opaque-id contract).
- **Reuse existing geometry/rotation; do not re-derive.** Cross-tile adjacency uses `neighbor(position, direction)` (Item 002) and the canonical→board mappings `rotateSide` / `rotateHalfEdge` (Item 003). The catalog stores canonical orientation; a placed tile's `rotation` maps its segment sides/half-edges to board directions before any adjacency test.
- **Connectivity is a graph over `(position, segmentId)` nodes.** Two segments are in the same feature iff they are transitively connected across shared tile edges by the rules below. A union-find / flood-fill over the placed tiles is the natural implementation (not mandated).
- **City / road connectivity (by side).** For a city or road segment `s` on placed tile `T` at position `p`: its board sides are `s.sides.map(side => rotateSide(side, T.rotation))`. For each board side `d`, look at the placed tile `T'` at `neighbor(p, d)` (if any) and find the segment `s'` on `T'` whose board sides include `opposite(d)` (N↔S, E↔W). If `s'` exists **and is the same type** as `s`, connect `s` and `s'`.
- **Field connectivity (by half-edge).** For a field segment `f` on `T`: its board half-edges are `f.halfEdges.map(h => rotateHalfEdge(h, T.rotation))`. A board half-edge on side `d` connects to the **physically-meeting** half-edge on the neighbour `T'` at `neighbor(p, d)`, per this contract (corners must align across the shared edge):

  | Shared edge (direction `d` from `T`) | `T` board half-edge | meets on `T'` |
  |---|---|---|
  | N | NW | SW |
  | N | NE | SE |
  | S | SW | NW |
  | S | SE | NE |
  | E | EN | WN |
  | E | ES | WS |
  | W | WN | EN |
  | W | WS | ES |

  If `T'` has a field segment owning the meeting half-edge, connect the two field segments. (This is the standard half-edge model required for Stage 4 farmer scoring; it is exercised here only for *grouping*, not scoring.)
- **Monasteries are single-tile features.** A `monastery` segment is its own feature (no cross-tile connectivity).
- **Completion rules.**
  - **City / road:** completed iff **no constituent segment has an open side** — i.e. for every board side of every segment in the feature, a placed tile exists in that direction. (A road that dead-ends *inside* a tile — e.g. tile A's `["S"]` road into the monastery — has no side at the internal terminus, so only its actual sides count.) An isolated `BASE-C` (city on all four sides, no neighbours) has 4 open sides ⇒ **not** completed.
  - **Monastery:** completed iff **all 8 surrounding grid positions** (orthogonal + diagonal) hold a placed tile. The *contents* of the 8 neighbours are irrelevant — presence only.
  - **Field:** **no completion concept** — `completed` is always `false` for fields (fields only matter at end-game, Stage 4). Document this explicitly rather than leaving it ambiguous.
  - Completion assumes legal boards (see Scope boundary); a neighbour present but type-mismatched is treated as not continuing the feature, leaving the side open.
- **Meeple attachment.** A meeple (Item 002 `MeeplePlacement`) belongs to a feature iff its `(position, segmentId)` matches one of the feature's constituent `(tile position, segment id)` members. Each feature lists the meeples on it with enough detail (`playerId`, `kind`, and the segment ref) for Item 007.
- **Deterministic output.** `extractFeatures` returns features in a **stable, deterministic order** (e.g. by the feature's minimum `(x, y)` tile position, then segment id), and each feature's internal lists are likewise ordered, so tests can assert on output without sorting. Determinism must not depend on board input order.

## Proposed types (shape, not final names)

```ts
type FeatureType = "city" | "road" | "monastery" | "field";

/** A (tile, segment) member of a feature. */
interface FeatureSegmentRef {
  position: Position;     // the placed tile's grid position
  segmentId: string;      // segment id local to that tile's catalog entry
}

/** A meeple sitting on a feature (enough for Item 007 to resolve ownership). */
interface FeatureMeeple {
  playerId: string;
  kind: MeepleKind;
  position: Position;
  segmentId: string;
}

interface Feature {
  type: FeatureType;
  segments: FeatureSegmentRef[];   // constituent (tile, segment) pairs
  tilePositions: Position[];       // distinct tiles spanned (city=2/tile, road=1/tile)
  completed: boolean;              // always false for fields
  meeples: FeatureMeeple[];
  pennants: number;                // city: total pennants across segments; else 0
}

function extractFeatures(board: BoardState, catalog: Catalog): Feature[];
```

`tilePositions` and `pennants` are carried so Items 008/009 stay thin (they could re-derive them, but extraction already has the data in hand). Exact file layout may vary — e.g. `packages/core/src/features/{types,extract,index}.ts` re-exported from `packages/core/src/index.ts`, consistent with the `board/` and `catalog/` module style.

## Acceptance criteria

- [x] `extractFeatures(board: BoardState, catalog: Catalog): Feature[]` and the `Feature` / `FeatureType` / `FeatureSegmentRef` / `FeatureMeeple` types are implemented in a new core module and **exported from `@carcassonne/core`**. Pure; does not mutate inputs.
- [x] Connected segments of the **same type** are grouped into one feature across tiles: cities and roads by side (via `rotateSide` + `neighbor` + opposite-side), fields by half-edge (per the field-adjacency table, via `rotateHalfEdge`). Segments not connected to anything form singleton features. Rotated tiles connect correctly (e.g. a straight road on a tile placed at rotation 90 connects to its E/W neighbours, not N/S).
- [x] Every placed tile's every segment appears in **exactly one** feature (the features partition all segments of all placed tiles). Monasteries are always singleton features.
- [x] `completed` is correct: a city/road is completed iff no constituent segment side is open (no missing neighbour tile); a monastery is completed iff all 8 surrounding positions are occupied; a field's `completed` is always `false`. An isolated `BASE-C` is **not** completed; an isolated monastery (`BASE-B`) is **not** completed; a monastery with all 8 neighbours present **is** completed.
- [x] Each feature lists the meeples on it: a meeple is attached iff its `(position, segmentId)` matches a constituent `(position, segmentId)`. A farmer (follower on a field segment) attaches to its field feature.
- [x] `pennants` on a city feature equals the total pennant count across its constituent city segments (e.g. a completed multi-tile city including `BASE-C` reflects its pennant); `pennants` is `0` for non-city features.
- [x] Output ordering is **deterministic** and independent of the order tiles/meeples appear in the `BoardState` (verified by a test that shuffles input and asserts equal output).
- [x] The feature module does not introduce a cyclic import (it may import from both `board/` and `catalog/`; neither of those imports the feature module). Core platform boundary intact.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–005) remain green.

> Maps to queue Item 006 ("feature-extraction function with unit tests over hand-authored boards") and the Stage 1 deliverable "foundation for the scoring engine." Note: this item does **not** by itself tick any Stage 1 *acceptance criterion* in progress.md — those require scoring (Items 007–010). It marks the queue item / deliverable progress only.

## Implementation steps

1. Read the model: `packages/core/src/board/{types,geometry}.ts`, `packages/core/src/catalog/{types,rotate}.ts`, and a few `data/base-game.ts` tiles (A, B, C, and a straight road/city tile) to ground fixtures.
2. Add `packages/core/src/features/types.ts` with `FeatureType`, `FeatureSegmentRef`, `FeatureMeeple`, `Feature`.
3. Add `packages/core/src/features/extract.ts` with `extractFeatures`:
   - Index placed tiles by serialized position; resolve each via `catalog.getTile`.
   - Build connectivity (union-find or flood-fill) using the city/road side rule and the field half-edge table above; group `(position, segmentId)` nodes.
   - For each group, compute `type`, `tilePositions`, `pennants`, `completed`, and attach matching meeples.
   - Sort the output and each feature's lists deterministically.
4. Re-export the public API from `packages/core/src/features/index.ts` and `packages/core/src/index.ts`.
5. Add `packages/core/test/feature-extraction.test.ts` (see strategy).
6. Run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** in `packages/core/test/feature-extraction.test.ts`, using `createBoard()` (Item 002) + `baseGameCatalog` (Item 004) to author boards:
  - **Single isolated tiles:** `BASE-C` → one city feature, not completed, 4 open sides, `pennants: 1`. `BASE-B` → one monastery feature (not completed) + one field feature (`completed: false`).
  - **Connected city across two tiles:** two tiles whose touching sides are both city → one city feature spanning both tiles; complete only when fully enclosed (small closed-city fixture) vs incomplete when an edge is open.
  - **Connected road:** a straight-road tile next to another so the road segments join into one road feature; assert tile span and completion (open ends ⇒ incomplete).
  - **Rotation:** place a straight-road/city tile at rotation 90 and assert it connects to E/W neighbours, not N/S (guards correct use of `rotateSide`/`rotateHalfEdge`).
  - **Fields by half-edge:** two adjacent field tiles connect into one field per the adjacency table; a road splitting a side keeps the two flanking fields separate where it should. `completed` is `false` for all fields.
  - **Monastery completion:** monastery tile with 0, 7, and all 8 surrounding tiles → completed only at 8.
  - **Meeples:** followers on a city, a road, and a field; assert each attaches to the right feature with `playerId`/`kind`; a follower on a field is reported as that field's meeple.
  - **Partition + determinism:** every segment of every placed tile appears in exactly one feature; building the same board with tiles/meeples added in a different order yields deep-equal `extractFeatures` output.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 002 (`BoardState`, `Position`, `neighbor`, meeples), Item 003 (`Catalog`, segment types, `rotateSide`/`rotateHalfEdge`), Item 004 (`baseGameCatalog` for realistic fixtures). Reuse their contracts; do not modify them.
- **Downstream:** Item 007 (ownership/majority over `Feature.meeples`), Item 008 (city/road scoring over completed features + `tilePositions`/`pennants`), Item 009 (monastery scoring + engine assembly), Item 010 (scenario suite), Stage 4 (field/farmer scoring reuses field grouping), Stage 9 (validation may reuse adjacency walking).

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config files, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (feature-extraction suite green; Items 001–005 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — `extractFeatures` exported from `@carcassonne/core`; groups cities/roads/monasteries/fields with correct `completed` and meeple attachment
- [x] Data verified — partition holds (every segment in exactly one feature); determinism under input reordering; `BASE-C` not completed, 8-neighbour monastery completed
- [x] Health checks pass — N/A

**Expected Outcomes**
- `extractFeatures` exported and pure; correctly groups all four feature types, computes completion per the rules, attaches meeples, and is deterministic.
- `npm run lint && npm run build && npm test` exits 0.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: N/A
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

- **Union-find over string-keyed `(position, segmentId)` nodes** (`"x,y|segmentId"`) was used for connectivity grouping, rather than an explicit flood-fill graph. This gives straightforward path-compressed grouping and matches the spec's suggested approach without being mandated by it.
- **Connectivity matching helpers search a neighbour tile's segments linearly** (`findSideSegment` / `findFieldSegmentOwningHalfEdge`) instead of pre-indexing segments by side/half-edge. Base-game tiles have at most ~4 segments per side type, so a linear scan is simple and fast enough; no additional index structure was introduced. Trade-off: this would need revisiting if a future catalog (e.g. an expansion) had tiles with many more segments per side.
- **`computeCompleted` re-derives each segment's board sides via `rotateSide`** rather than caching them from the connectivity pass. This keeps the completion check a self-contained, easily-auditable function at the cost of a small amount of recomputation — judged worth it for clarity/testability over micro-optimization.
- **Deterministic ordering** sorts features by the minimum `(x, y)` of their `tilePositions`, then by their first (already-sorted) segment's `segmentId`, then by `type` as a final tiebreaker. The `type` tiebreaker is a defensive fallback for the case where two singleton features start on the same minimal position and segment-id ordering alone doesn't disambiguate (in practice segment ids differ on real catalog tiles, so this rarely triggers). Internal lists (`segments`, `tilePositions`, `meeples`) are sorted independently by position then id (then `playerId` for meeples), so output is independent of board/meeple input order.
- **`pennants` are summed via a structural cast** (`(n.segment as { pennant?: boolean }).pennant`) because `Segment` is a discriminated union and only `CitySegment` carries `pennant`. The cast is only invoked when `type === "city"`, so it is safe in context; this avoided introducing a wider type-narrowing utility for a single call site.
- **No new `posKey`-equivalent export was added to the board module.** Position-key serialization for the union-find map stays as a small local helper inside `extract.ts`, consistent with `builder.ts` (Item 002) keeping its own private `posKey` rather than exposing internal key-serialization as part of the public board API.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 006 progress against the Stage 1 deliverable "Scoring engine (base game, incremental)" / "foundation for scoring engine" (the deliverable stays 📋/🚧 until Items 007–010 land). Stage 1 stays 🚧 In Progress. Do **not** tick the Stage 1 scoring acceptance criteria — those require Items 007–010. Update only Item 006's progress. Status flow for this item: 📋 → 🚧 → ✅.
