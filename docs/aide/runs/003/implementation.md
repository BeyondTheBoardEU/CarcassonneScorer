# Implementation Report — Item 003
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-15

## Summary

The partial Item 003 implementation in the working tree was already complete and spec-compliant. All five source files under `packages/core/src/catalog/` and the test file at `packages/core/test/catalog.test.ts` were validated against the spec and required no changes. The catalog types, loader, rotation helpers, sample data, and typed error are all present, correctly wired, and re-exported from `@carcassonne/core`. The CI gate (`npm run lint && npm run build && npm test`) passes green with 102 tests (71 catalog-specific) across 3 test files.

## Files changed

- `packages/core/src/catalog/types.ts` — catalog schema: `SegmentType`, `Side`, `HalfEdge`, segment shapes (`CitySegment`, `RoadSegment`, `FieldSegment`, `MonasterySegment`), `TileDefinition`, `Catalog`
- `packages/core/src/catalog/errors.ts` — typed `CatalogError` with `kind` discriminant covering all six error cases
- `packages/core/src/catalog/loader.ts` — `loadCatalog`: validates and indexes tiles; throws `CatalogError` for all five malformation classes
- `packages/core/src/catalog/rotate.ts` — `rotateSide` and `rotateHalfEdge` pure helpers; imports `Rotation` from `../board/types.js` (no cyclic dependency)
- `packages/core/src/catalog/data/samples.ts` — two hand-written sample tiles: `ROAD-STRAIGHT` (road + 2 fields) and `CITY-PENNANT` (city with pennant + 1 field referencing the city)
- `packages/core/src/catalog/data/index.ts` — data barrel re-exporting `sampleTiles`
- `packages/core/src/catalog/index.ts` — catalog module barrel re-exporting all public API
- `packages/core/src/index.ts` — re-exports catalog types and values from `@carcassonne/core`

## Tests added/updated

- `packages/core/test/catalog.test.ts` — 71 tests covering:
  - `loadCatalog` indexing (`getTile`/`has`/`all`) and edge cases (empty array, single tile, immutable copy)
  - All five validation rejections: duplicate tile id, duplicate segment id, unknown segment type, duplicate half-edge, unknown adjacent city
  - Sample tile segment spot-checks: road sides, field count, city pennant, field `adjacentCities`
  - `rotateSide` table-driven cases for all 4 rotations × 4 sides (16 cases)
  - `rotateHalfEdge` table-driven cases for all 4 rotations × 8 half-edges (32 cases)
  - Round-trip properties: four 90° rotations return identity; 180° = two 90°; 270° = three 90°

## How to verify

```
npm run lint && npm run build && npm test
```

All 102 tests pass (3 test files). No lint or build errors.

## Decisions (for doc-updater)

- `Side` is re-declared in `catalog/types.ts` (not imported from `board/types.ts`) to prevent a cyclic import; `rotate.ts` imports only `Rotation` from the board module, which is a one-way dependency.
- `CatalogError.kind` is a string-literal union (not an enum) to keep the module dependency-free and serialisation-friendly.
- `getTile` throws `CatalogError("unknown-tile-id", ...)` rather than returning `undefined`; callers who want a safe lookup can call `has()` first.
- Sample tile `ROAD-STRAIGHT` uses half-edges `["NW","WN","WS","SW"]` for the west field and `["NE","EN","ES","SE"]` for the east field, covering all 8 half-edges across two fields (road sides N/S carry no half-edges directly).
- `all()` returns a shallow copy of the insertion-order snapshot so external mutation cannot affect the catalog.
