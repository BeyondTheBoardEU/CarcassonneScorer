# Check Report — Item 005
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-16
- Attempt: 1

## Commands run

- `npm run lint` → exit 0 / ESLint clean, Prettier formatting OK
- `npm run build` → exit 0 / tsc --noEmit clean
- `npm test` → exit 0 / 186 tests passed (5 test files: smoke, board-state, catalog, base-game-catalog, catalog-consistency)

## Acceptance criteria (from the spec)

- [x] `checkCatalogConsistency(catalog: Catalog): CatalogIssue[]` (and `CatalogIssue` / `ConsistencyIssueCode` types) implemented and **exported from `@carcassonne/core`** — confirmed at `packages/core/src/catalog/consistency.ts:96` (function), `packages/core/src/catalog/index.ts:36-37` (catalog barrel re-export), `packages/core/src/index.ts:63-66` (top-level re-export). Function never throws: it accumulates into `issues[]` and returns; catch is structural (no throw statements in the checker itself).
- [x] All six invariant classes detected with documented codes — verified by reading `consistency.ts` (invariants 1–6 implemented in `checkTile` at lines 127–180) and confirmed by 30 passing tests in `catalog-consistency.test.ts` with one focused per-code broken-fixture test each (`empty-tile`, `side-conflict`, `half-edge-uncovered`, `half-edge-on-city-side`, `pennant-on-non-city`, `adjacent-city-invalid`, `malformed-segment`).
- [x] `checkCatalogConsistency(baseGameCatalog)` returns `[]` — test "checkCatalogConsistency(baseGameCatalog) returns [] (no issues)" passes (`catalog-consistency.test.ts:579`); also tested as "returns [] for the base-game catalog" at line 52. Both pass.
- [x] Per-invariant broken-fixture tests, one per code — confirmed in `catalog-consistency.test.ts`: `empty-tile` (line 118), `side-conflict` (lines 141–195), `half-edge-uncovered` (lines 201–247), `half-edge-on-city-side` (lines 253–296), `pennant-on-non-city` (lines 302–358), `adjacent-city-invalid` (lines 365–406), `malformed-segment` (lines 412–506). All pass.
- [x] Base-game assertions: 24 tiles (test at line 513 passes); counts sum to 72 (test at line 517 passes); pennant set exactly {C,F,M,O,Q,S} (test at line 526 passes); tiles A and B each have exactly one monastery segment (tests at lines 554, 561 pass); no other tile has a monastery (test at line 567 passes).
- [x] `npm run lint && npm run build && npm test` exits 0; Items 003 and 004 suites remain green (71 + 54 = 125 pre-existing catalog/base-game tests all pass); no catalog↔board cyclic import (consistency.ts only imports from `./types.js`, confirmed at line 15; no board import anywhere in the catalog module); no changes to `loadCatalog` contract or Item 003/004 public types (loader.ts and types.ts unchanged; only additions made to index.ts barrel files).

## Invariant 3 sanity check

The half-edge completeness logic in `checkHalfEdgeCompleteness` (`consistency.ts:321-365`) correctly:
- Builds a map of `HalfEdge → fieldSegmentId` from all field segments on the tile.
- Iterates all four sides. For city sides (tracked in `citySides`): reports `half-edge-on-city-side` if any half-edge of that side is owned by a field. For non-city sides: reports `half-edge-uncovered` if either half-edge has no field owner.
- The `SIDE_HALF_EDGES` map (`N→[NW,NE], E→[EN,ES], S→[SE,SW], W→[WS,WN]`) matches the Item 003 spec definition exactly.
- Broken-fixture `HE-UNCOVERED` (road on N and S, field only covering NE/EN/ES/SE) correctly produces `half-edge-uncovered` for NW, SW, WS, WN (4 issues); test asserts `>= 2`. Broken-fixture `BOTH-HE-ON-CITY` (city on N, field claiming NW and NE) correctly produces 2 `half-edge-on-city-side` issues. The checker is definitively not trivially returning `[]` — the base-game happy-path test itself would fail if it were.

## Required fixes

None.
