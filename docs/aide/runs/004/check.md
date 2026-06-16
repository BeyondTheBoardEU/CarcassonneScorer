# Check Report — Item 004
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-16
- Attempt: 1

## Commands run

- `npm run lint` → exit 0 / eslint + prettier both clean
- `npm run build` → exit 0 / tsc --noEmit clean (no type errors)
- `npm test` → exit 0 / 4 test files, 156 tests, 0 failures (54 new in base-game-catalog.test.ts + 102 pre-existing)

## Acceptance criteria (from the spec)

- [x] All **24 distinct** base-game tile types (codes A–X) exist as `TileDefinition`s under `packages/core/src/catalog/data/` with unique stable ids — `base-game.ts` defines `BASE-A` … `BASE-X`; uniqueness enforced by loader and asserted in test "all 24 tile codes A–X are present" + "all tile ids are unique" (base-game-catalog.test.ts:71–101, 60–64).

- [x] `baseGameTiles` array and `baseGameCatalog` exported from `@carcassonne/core` — confirmed in `packages/core/src/index.ts:61-63`, `packages/core/src/catalog/index.ts:33`, `packages/core/src/catalog/data/index.ts:5`.

- [x] `loadCatalog(baseGameTiles)` succeeds without throwing — test "loadCatalog(baseGameTiles) does not throw" passes; loader validates unique ids, known types, no duplicate half-edges, valid adjacentCities references (base-game-catalog.test.ts:52-54).

- [x] Every tile models its segments correctly — city/road segments reference `sides`; field segments use `halfEdges`; pennants set only on C, F, M, O, Q, S; monastery tiles A and B carry a `MonasterySegment`; every segment `meepleable: true` — confirmed by: "every segment across all tiles has meepleable: true" test (line 103-109); pennant guard tests (lines 358-385); monastery guard test (lines 439-446); spot-check tests for B, A, C, M, Q, H, I, W, L; tile data in base-game.ts verified by code review.

- [x] Each tile records a `count`; counts sum to **72** — test "sum of all tile counts equals 72" passes (base-game-catalog.test.ts:66-69); manual verification: 2+4+1+4+5+2+1+3+2+3+3+3+2+3+2+3+1+3+2+1+8+9+4+1 = 72.

- [x] Tests prove the data loads and spot-check representative tiles; `npm run lint && npm run build && npm test` exits 0 — all three commands exit 0; tests cover B, A, C, X, U, M, Q, R, H, I, W, L with explicit segment structure assertions.

- [x] Item 003 `sampleTiles` and their tests remain intact; no schema/loader changes; no catalog↔board cyclic import — `catalog.test.ts` (71 tests) still passes; `types.ts` and `loader.ts` unchanged; catalog imports only from `../types.js` and `../loader.js` (no board imports); board `types.ts` explicitly does not import from catalog.

## Geometry / data spot-checks (sanity, not exhaustive)

- **BASE-B**: monastery + 1 field with all 8 half-edges + adjacentCities:[] — correct.
- **BASE-A**: monastery + road sides:["S"] + 1 field with all 8 half-edges (field wraps around the whole tile as the road only exits one side) — correct per spec.
- **BASE-C**: 1 city sides:["N","E","S","W"] pennant:true, no fields — correct.
- **BASE-D**: city sides:["N"] + road sides:["E","W"] + f-n [EN,WN] adjacentCities:["city"] + f-s [ES,SE,SW,WS] adjacentCities:[] — road separates fields correctly.
- **BASE-E**: city N + f1 [EN,ES,SE,SW,WS,WN] adjacentCities:["city"] — correct (6 half-edges for E, S, W sides).
- **BASE-F**: city sides:["N","S"] pennant:true + f1 [WS,WN] + f2 [EN,ES] both adjacentCities:["city"] — correct.
- **BASE-H**: city1 N + city2 S + f1 [EN,ES,WS,WN] adjacentCities:["city1","city2"] — two separate cities, one field, correct.
- **BASE-U**: road sides:["N","S"] + f1 [NW,WN,WS,SW] + f2 [NE,EN,ES,SE], 8 half-edges total — correct.
- **BASE-X**: 4 road arms (one side each) + 4 corner fields (2 half-edges each) = 8 half-edges total — correct.
- **BASE-M**: city sides:["N","W"] pennant:true + f1 [EN,ES,SE,SW] adjacentCities:["city"] — correct.
- **BASE-Q**: city sides:["N","E","W"] pennant:true + f1 [SE,SW] adjacentCities:["city"] — correct.
- **BASE-W**: 3 road arms (N,E,S one side each) + f-ne [NE,EN] + f-se [ES,SE] + f-sw [SW,WS,WN,NW] — 8 half-edges, correct.

All counts match spec table; pennants on exactly C, F, M, O, Q, S confirmed by guard test.
