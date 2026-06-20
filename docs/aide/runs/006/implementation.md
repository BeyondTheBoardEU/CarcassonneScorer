# Implementation Report — Item 006
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-20

## Summary
Implemented `extractFeatures(board, catalog)` — a pure, platform-independent function in a new `packages/core/src/features/` module that walks a `BoardState` against a `Catalog` and groups placed-tile segments into cities, roads, monasteries, and fields. Connectivity reuses Item 002's `neighbor` and Item 003's `rotateSide`/`rotateHalfEdge` (cities/roads connect by board side; fields connect by the half-edge adjacency table). Completion follows the spec rules (no open side for city/road; all 8 grid neighbours present for monastery; always `false` for fields). Meeples are attached by `(position, segmentId)` match, pennants are summed across constituent city segments, and the whole output (features, and each feature's internal lists) is deterministically ordered independent of input order. The new types/function are exported from `@carcassonne/core`.

## Files changed
- `packages/core/src/features/types.ts` — new: `FeatureType`, `FeatureSegmentRef`, `FeatureMeeple`, `Feature`.
- `packages/core/src/features/extract.ts` — new: `extractFeatures`, union-find connectivity over `(position, segmentId)` nodes, side-based city/road connection, half-edge-based field connection, completion rules, meeple attachment, deterministic sorting helpers.
- `packages/core/src/features/index.ts` — new: barrel re-exporting the feature module's public API.
- `packages/core/src/index.ts` — added the "Feature extraction (Item 006)" export block (`Feature`, `FeatureMeeple`, `FeatureSegmentRef`, `FeatureType`, `extractFeatures`).

No existing Item 002/003/004 file was modified — geometry/rotation/catalog contracts are imported and reused as-is.

## Tests added/updated
- `packages/core/test/feature-extraction.test.ts` (new, 19 tests across 7 `describe` blocks):
  - **Isolated tiles**: `BASE-C` alone (one city, not completed, `pennants: 1`); `BASE-B` alone (one monastery not completed + one field, `completed: false`).
  - **Connected cities**: `BASE-H` stacked (city1↔city2 join, completed; the other city on the same tile stays a separate incomplete singleton); `BASE-E` cap-to-cap (2-tile fully enclosed city, completed, no pennant); `BASE-F` + `BASE-E` cap (one side closed, the other open ⇒ still incomplete, `pennants: 1`); `BASE-D` alone (open city cap, incomplete).
  - **Connected roads**: two `ROAD-STRAIGHT` tiles end-to-end (joined, still incomplete — open ends); a single `ROAD-STRAIGHT` tile (incomplete).
  - **Rotation**: `ROAD-STRAIGHT` rotated 90° connects to its E neighbour, not a tile placed to its N (guards `rotateSide` usage).
  - **Fields by half-edge**: two `BASE-B` tiles merge into one field; `BASE-D`'s road on E/W keeps `f-n`/`f-s` separate on the same tile; `BASE-X` (crossroads) keeps its four field corners as four distinct features.
  - **Monastery completion**: 0/8, 7/8, 8/8 surrounding tiles around a `BASE-A`-style monastery (`BASE-B`) — completed only at 8.
  - **Meeples**: a follower on a city, a follower on a road, and a farmer on a field (`BASE-D`) each attach to the correct feature; the other field on the same tile has no meeples.
  - **Partition + determinism**: every segment of a 4-tile board appears in exactly one feature (segment count matches catalog definitions); rebuilding the same board with tiles/meeples in reversed order yields a deep-equal `extractFeatures` result; `BASE-X`'s four road segments stay as four separate incomplete singleton features.

## How to verify
```
npm run lint && npm run build && npm test
```
All three exit 0; the new `feature-extraction.test.ts` suite (19 tests) passes alongside the existing Items 001–005 suites (205 tests total, 0 failures).

## Decisions (for doc-updater)
- **Union-find over string-keyed `(position, segmentId)` nodes** (`"x,y|segmentId"`), rather than a flood-fill graph, for straightforward path-compressed grouping; not mandated by the spec but matches its suggested approach.
- **Connectivity matching helper functions search a neighbour tile's segments linearly** (`findSideSegment` / `findFieldSegmentOwningHalfEdge`) rather than pre-indexing by side/half-edge — base-game tiles have at most ~4 segments per side type, so this is simple and fast enough; no index structure was introduced.
- **`computeCompleted` re-derives each segment's board sides via `rotateSide`** rather than caching them from the connectivity pass, keeping the completion check a self-contained, easily-auditable function at the cost of a small amount of recomputation.
- **Deterministic ordering**: features are sorted by the minimum `(x, y)` of their `tilePositions`, then by their first (already-sorted) segment's `segmentId`, then by `type` as a final tiebreaker (relevant when two singleton features start on the same minimal position and segment-id ordering alone doesn't disambiguate, e.g. a monastery and field both rooted at the same tile but different ids — in practice segment ids differ, so the `type` tiebreaker is a defensive fallback). Internal lists (`segments`, `tilePositions`, `meeples`) are sorted independently by position then id (then `playerId` for meeples).
- **`pennants` summed via a structural cast** (`(n.segment as { pennant?: boolean }).pennant`) since `Segment` is a union and only `CitySegment` carries `pennant`; only invoked when `type === "city"`, so the cast is safe in context.
- Did not add a `posKey`-equivalent export from the board module — kept it as a small local helper in `extract.ts` (consistent with `builder.ts` having its own private `posKey`, per item 002's precedent of not exposing internal key-serialization).

## Blockers
None.
