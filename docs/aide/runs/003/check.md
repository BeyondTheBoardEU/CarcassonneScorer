# Check Report — Item 003
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-15
- Attempt: 1

## Commands run

- `npm run lint` → exit 0 / ESLint + Prettier clean, all files pass
- `npm run build` → exit 0 / tsc --noEmit succeeds with no errors
- `npm test` → exit 0 / 102 tests passed across 3 files (2 smoke, 29 board-state, 71 catalog)

## Acceptance criteria (from the spec)

- [x] Catalog types (`SegmentType`, `Side`, `HalfEdge`, segment shapes, `TileDefinition`, `Catalog`) are defined and exported from `@carcassonne/core`.
  Evidence: `packages/core/src/catalog/types.ts` defines all named types; `packages/core/src/catalog/index.ts` re-exports them; `packages/core/src/index.ts:43-54` re-exports all catalog types from `@carcassonne/core`. Build green confirms TypeScript accepts all exports.

- [x] `loadCatalog(tiles)` validates input and returns an indexed `Catalog` with `getTile`/`has`/`all`; it throws a typed `CatalogError` (never returns a malformed catalog).
  Evidence: `packages/core/src/catalog/loader.ts` implements all three methods. Test `loadCatalog — indexing` suite (8 tests) verifies retrieval and edge cases. `getTile` throws `CatalogError("unknown-tile-id", ...)` for absent ids (test: "getTile() throws CatalogError(unknown-tile-id) for absent id").

- [x] The format expresses typed segments (city/road/field/monastery), pennants, per-segment `meepleable`, city/road `sides`, field `halfEdges`, and field→city `adjacentCities`.
  Evidence: `packages/core/src/catalog/types.ts:43-95` declares `CitySegment` (with `pennant?`, `meepleable`, `sides`), `RoadSegment` (`sides`, `meepleable`), `FieldSegment` (`halfEdges`, `adjacentCities`, `meepleable`), `MonasterySegment` (`meepleable`). Sample tiles exercise all fields (test suite "sample tiles — segment structure").

- [x] `rotateSide` / `rotateHalfEdge` correctly map canonical orientation to 0/90/180/270, verified by tests. (Consumes Item 002 `Rotation` type.)
  Evidence: `packages/core/src/catalog/rotate.ts:15` imports `Rotation` from `../board/types.js`. Table-driven tests in "rotateSide — table-driven" (16 cases) and "rotateHalfEdge — table-driven" (32 cases) cover all four rotations × all sides/half-edges. Round-trip property tests ("rotation round-trip properties", 4 tests) confirm four 90° rotations return identity, 180°=two 90°, 270°=three 90°. Manual spot-check of 270° table values confirmed correct.

- [x] At least two hand-written sample tiles exist in the data folder and load successfully.
  Evidence: `packages/core/src/catalog/data/samples.ts` defines `ROAD-STRAIGHT` (road + 2 fields covering all 8 half-edges) and `CITY-PENNANT` (city with pennant + 1 field). Test "loads sample tiles without throwing" verifies both load; "has() returns true for a loaded tile id" checks both ids. CITY-PENNANT field has 4 half-edges covering S and W sides; the N and E sides are city-covered, consistent with spec ("unless covered by a city occupying that whole side").

- [x] Loader-level validation rejects duplicate tile id, duplicate segment id, unknown segment type, duplicate half-edge, and `adjacentCities` referencing a non-existent city segment.
  Evidence: Five separate `describe` blocks in `packages/core/test/catalog.test.ts:97-207` each test one malformation, verifying both that `CatalogError` is thrown and that `kind` matches exactly. All five pass. (Note: the spec lists 5 malformations; `CatalogError` has 6 `kind` values including "unknown-tile-id" for `getTile` — not a validation gap, that is a retrieval error also covered by tests.)

- [x] No catalog↔board cyclic import; core platform boundary intact (`npm run build` green).
  Evidence: `packages/core/src/catalog/types.ts:7-11` explicitly documents no board imports; it re-declares `Side` to avoid a cycle. `rotate.ts` imports only `Rotation` (a type-only import) from `../board/types.js`, which is a one-way dependency: board has no catalog imports (`packages/core/src/board/types.ts:7-9` confirms "board module deliberately does NOT import the tile catalog"). `npm run build` exits 0.
