# Check Report — Item 006
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-20
- Attempt: 1

## Commands run
- `npm run lint` → exit 0 (eslint + prettier --check clean)
- `npm run build` → exit 0 (`tsc -p packages/core/tsconfig.json --noEmit`, no errors)
- `npm test` → exit 0 — 6 files, 205 tests passed, 0 failures (includes the new `packages/core/test/feature-extraction.test.ts`, 19 tests, alongside the existing Items 001–005 suites: smoke 2, board-state 29, catalog-consistency 30, catalog 71, base-game-catalog 54)

## Acceptance criteria (from the spec)
- [x] `extractFeatures(board, catalog): Feature[]` and `Feature`/`FeatureType`/`FeatureSegmentRef`/`FeatureMeeple` implemented in a new core module, exported from `@carcassonne/core` — `packages/core/src/features/{types,extract,index}.ts`, re-exported in `packages/core/src/index.ts:71-72`. Pure: no mutation, builds local `Map`/`UnionFind` structures only (`extract.ts:115-148`).
- [x] Connected segments of the same type grouped across tiles by side (city/road, `extract.ts:154-191`) using `rotateSide`+`neighbor`+`OPPOSITE` table (`extract.ts:19,161-172`), and by half-edge (field, `extract.ts:193-233`) using `rotateHalfEdge` + the `FIELD_HALF_EDGE_MEETS` table (`extract.ts:26-31`), which is byte-for-byte identical to the spec's adjacency table (item 006 spec lines 33-41). Unconnected segments form singletons (verified by `BASE-X` test, 4 separate road + 4 separate field singleton features — `feature-extraction.test.ts:259-264,409-417`). Rotation correctness verified by test "a straight road rotated 90 degrees connects to E/W neighbours, not N/S" (`feature-extraction.test.ts:194-217`) — passes.
- [x] Every segment of every placed tile appears in exactly one feature; monasteries are always singletons (no cross-tile connectivity code path exists for `type === "monastery"`, `extract.ts:143-144`). Verified by the partition test (`feature-extraction.test.ts:361-385`), which asserts `seen.size` equals the sum of catalog segment counts across all 4 placed tiles with no duplicate `(position, segmentId)` keys — passes.
- [x] `completed` correct for all four cases: city/road = no open side (`computeCompleted`, `extract.ts:354-366`, re-derives board sides via `rotateSide` and checks `neighbor` presence); monastery = all 8 grid neighbours present (`extract.ts:349-352`, `ALL_OFFSETS` covers all 8 orthogonal+diagonal cells, `extract.ts:369-378`); field always `false` (`extract.ts:345-347`). Isolated `BASE-C` not completed (`feature-extraction.test.ts:42-53`, pennants:1 too), isolated `BASE-B` monastery not completed (`feature-extraction.test.ts:55-69`), monastery completed only at 8/8 neighbours and not at 0/8 or 7/8 (`feature-extraction.test.ts:271-320`) — all pass.
- [x] Meeples attached by `(position, segmentId)` match (`meeplesByNode` keyed lookup, `extract.ts:266-275,314-327`). Test places a follower on a city, a follower on a road, and a farmer on a field, asserting each attaches only to its own feature and the sibling field segment on the same tile gets none (`feature-extraction.test.ts:326-353`) — passes.
- [x] `pennants` = sum of `pennant` across constituent city segments, 0 for non-city (`extract.ts:307-310`). Verified: `BASE-C` alone → `pennants: 1` (`feature-extraction.test.ts:50`); two-tile `BASE-E` cap-to-cap (no pennant segments) → `pennants: 0` (`feature-extraction.test.ts:129`); `BASE-F`+`BASE-E` joined city (one pennant segment) → `pennants: 1` (`feature-extraction.test.ts:148`) — all pass.
- [x] Deterministic, input-order-independent output: `sortFeatures`/`sortSegmentRefs`/`sortPositions`/`sortMeeples` (`extract.ts:395-455`) apply a total order by position then id. Test builds the same board with `tiles`/`meeples` arrays reversed and asserts `toEqual` deep-equality (`feature-extraction.test.ts:387-407`) — passes.
- [x] No cyclic import: `features/` imports only from `board/` and `catalog/` (`extract.ts:12-16`); grepped `board/*.ts` and `catalog/*.ts` for any reference to `feature` — none found. `packages/core/src/index.ts` only gained an additive export block (`index.ts:68-72`); no existing board/catalog file was modified (confirmed via `git diff` — only `packages/core/src/index.ts` changed outside `features/`, purely additive).
- [x] `npm run lint && npm run build && npm test` exits 0 — verified independently above; all prior Items 001–005 suites remain green (205/205 total).

## Scope boundary check
- No scoring/points logic: grepped `packages/core/src/features` for `points|score|majority|ownership|owner` — only doc-comments referencing future items (Item 007/008/009), no executable logic.
- No ownership resolution: `FeatureMeeple` only carries `playerId`/`kind`/`position`/`segmentId`; no majority/tie computation exists in `extract.ts`.
- No board-legality validation: `findSideSegment`/`findFieldSegmentOwningHalfEdge` silently return `undefined` on a type mismatch (`extract.ts:176-191,219-233`) rather than throwing — consistent with "does not connect, does not raise an error."
- Items 002/003 contracts untouched: `git diff` shows no modifications to `packages/core/src/board/*` or `packages/core/src/catalog/*` (only an additive 6-line export block appended to `packages/core/src/index.ts`).

## Notes
- Catalog fixture data (`BASE-D`, `BASE-E`, `BASE-F`, `BASE-H`, `BASE-X`, etc., `packages/core/src/catalog/data/base-game.ts`) was independently cross-checked against the test file's stated assumptions (sides/half-edges/pennants) — all match, confirming the tests exercise real connectivity/completion logic rather than asserting against incorrect fixture assumptions.
- `rotateSide`/`rotateHalfEdge` tables (`packages/core/src/catalog/rotate.ts`) and `neighbor` (`packages/core/src/board/geometry.ts`, N = +y) were read directly to confirm the rotation/connectivity test for the 90°-rotated road and the BASE-H stacking test are geometrically correct, not just internally self-consistent.
