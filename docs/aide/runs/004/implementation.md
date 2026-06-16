# Implementation Report — Item 004
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-15

## Summary

Authored all 24 base-game tile types (A–X) as `TileDefinition`s in `packages/core/src/catalog/data/base-game.ts`, following the half-edge model and modelling conventions from samples.ts and types.ts. Exported `baseGameTiles` (ordered array) and `baseGameCatalog` (pre-loaded via `loadCatalog`) through the data barrel, catalog index, and the root `packages/core/src/index.ts`. Added 54 tests covering catalog-level invariants, 9 tile spot-checks, a pennant guard, and structural checks for all segment categories. All 156 tests pass (54 new + 102 pre-existing); `npm run lint && npm run build && npm test` exits 0.

## Files changed

- `packages/core/src/catalog/data/base-game.ts` — new file; defines all 24 tile `TileDefinition`s (A=BASE-A … X=BASE-X), `baseGameTiles` array, and eagerly-loaded `baseGameCatalog`
- `packages/core/src/catalog/data/index.ts` — added re-exports of `baseGameTiles` and `baseGameCatalog` from `./base-game.js`
- `packages/core/src/catalog/index.ts` — added re-exports of `baseGameTiles` and `baseGameCatalog` from `./data/index.js`
- `packages/core/src/index.ts` — added `baseGameTiles` and `baseGameCatalog` to the public barrel export

## Tests added/updated

- `packages/core/test/base-game-catalog.test.ts` — 54 new tests:
  - Catalog invariants: `loadCatalog(baseGameTiles)` does not throw; 24 tiles; unique ids; counts sum to 72; all 24 BASE-* ids present; every segment `meepleable: true`
  - Spot-check BASE-B: monastery + single all-8-half-edge field, no city/road
  - Spot-check BASE-A: monastery + single-side road (S) + field
  - Spot-check BASE-C: 4-sided city, pennant, no field
  - Spot-check BASE-X: 4 road arms (one side each) + 4 corner fields (2 half-edges each)
  - Spot-check BASE-U: straight road N/S + 2 fields covering all 8 half-edges combined
  - Spot-check BASE-M: 2-side city (N+W), pennant, 1 field with adjacentCities
  - Spot-check BASE-Q and BASE-R: 3-side city, field on S, pennant guard
  - Pennant guard: exactly BASE-C/F/M/O/Q/S have a pennanted city; no others do
  - Structural checks for BASE-H, BASE-I, BASE-W, BASE-L, monastery tile presence

## How to verify

```
npm run lint && npm run build && npm test
```

All 156 tests should pass (4 test files, 0 failures).

## Decisions (for doc-updater)

- **Tile A field topology**: The road exits only one side (S), so the surrounding field is one connected region. All 8 half-edges are assigned to a single field segment `f1` (the field wraps around N, E, W, and both halves of S). This is topologically correct because the road does not cross to a second side, so it never isolates the west-of-road area from the east-of-road area via N/E/W.

- **Tile D field topology (start tile)**: City on N, road runs straight E–W. Creates two fields: `f-n` (strip between city wall and road, half-edges EN + WN, borders city) and `f-s` (large area south of road, half-edges ES + SE + SW + WS, no city adjacency). The road separates them; `f-s` is not adjacent to the city.

- **Tile K (mirror of J)**: Road curves from W to S (through SW corner). `f1` = large outer field (WN, EN, ES, SE), borders city. `f2` = small SW corner (WS, SW), no city. 2 fields total (not 3 as initially drafted).

- **Stable tile ids**: Prefix `BASE-` plus the single letter code (BASE-A … BASE-X). This satisfies the spec's stable human-readable id requirement and avoids collision with the Item 003 sample tiles (ROAD-STRAIGHT, CITY-PENNANT).

- **Count source**: Counts match the widely documented base-game distribution (72 total) as given in the spec table. No deviations found vs the spec table.

- **V tile canonical orientation**: Road curve enters N and exits W (curves through NW corner). `f-in` = large inner field (NE, EN, ES, SE, SW, WS); `f-out` = tiny outer NW corner (NW, WN). No city adjacency on either field.

- **W tile canonical orientation**: T-junction with open arms N, E, S; W side is field. Creates 3 fields: `f-ne` (NE+EN), `f-se` (ES+SE), `f-sw` (SW+WS+WN+NW — the large western field).
