# Item 003 — Tile catalog format and schema

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-14

---

## Description

Design the **single authoritative catalog format** that defines a tile: its edges typed as city / road / field / monastery, how segments connect across the tile interior (which field borders which city, whether a road passes through), pennants, and which features can carry a meeple. Specify it as **data** (not code) plus a **typed loader** in the core that validates and indexes the data. Document the format so expansions can later be added in the same shape. Deliverable: catalog schema + loader + a couple of hand-written sample tiles with loader tests.

This is vision principle 2 made concrete: one catalog format consumed by scoring, validation, and recognition alike. It must be expressive enough for **farmer/field scoring** later (Stage 4) — i.e. fields, their bordering cities, and how fields connect across tiles — without those consumers existing yet. Item 004 populates this format with the full base game; Item 005 adds the comprehensive consistency test suite. This item provides the **format + loader + a few sample tiles** only.

## Design decisions (decided here)

- **Data, not code.** Tile definitions are plain data (a typed object literal / JSON-shaped module under `packages/core/src/catalog/data/`), imported via ESM — **no filesystem reads** (core stays platform-independent). The loader validates and indexes them.
- **Segment model.** A tile is a set of **segments**, each a feature piece: `{ id, type, pennant?, meepleable }` where `type ∈ {"city","road","field","monastery"}`. `id` is local to the tile (e.g. `"c1"`, `"r1"`, `"f1"`).
- **City/road edges.** Each tile side `N|E|S|W` that carries a city or road maps to the segment occupying it, for cross-tile adjacency matching. (Two adjacent tiles connect when the touching sides reference compatible segment types.)
- **Field half-edges (for farmers).** Each side is split into **two half-edges** (8 per tile, e.g. `"NW","NE","EN","ES","SE","SW","WS","WN"` reading clockwise). Every half-edge belongs to exactly one **field** segment (unless covered by a city occupying that whole side). This is what lets fields connect across tiles and lets a road split a side between two fields — the standard model required for correct farmer scoring in Stage 4.
- **Field↔city bordering.** Each field segment declares `adjacentCities: string[]` (local city segment ids it borders) so Stage 4 can score a field by the number of distinct **completed** cities it touches.
- **Meepleable.** Each segment flags whether a meeple may be placed (base game: knights on cities, robbers on roads, farmers on fields, a monk on a monastery — all meepleable).
- **Rotation is applied at scoring time, not stored in the catalog.** The catalog describes a tile in its canonical (unrotated) orientation; a placed tile's `rotation` (from the Item 002 board-state model) maps canonical sides/half-edges to board directions. This item provides a pure helper for that mapping so item 006 can use it.

## Proposed schema (shape, not final names)

```ts
type SegmentType = "city" | "road" | "field" | "monastery";
type Side = "N" | "E" | "S" | "W";
type HalfEdge = "NW"|"NE"|"EN"|"ES"|"SE"|"SW"|"WS"|"WN"; // 2 per side, clockwise

interface CitySegment   { id: string; type: "city";   sides: Side[]; pennant?: boolean; meepleable: boolean; }
interface RoadSegment   { id: string; type: "road";   sides: Side[]; meepleable: boolean; }
interface FieldSegment  { id: string; type: "field";  halfEdges: HalfEdge[]; adjacentCities: string[]; meepleable: boolean; }
interface MonasterySegment { id: string; type: "monastery"; meepleable: boolean; }
type Segment = CitySegment | RoadSegment | FieldSegment | MonasterySegment;

interface TileDefinition { id: string; segments: Segment[]; /* optional: count, expansion id */ }
interface Catalog { getTile(id: string): TileDefinition; has(id: string): boolean; all(): TileDefinition[]; }

function loadCatalog(tiles: TileDefinition[]): Catalog;   // validates + indexes; throws CatalogError on malformed input
function rotateSide(side: Side, rotation: Rotation): Side; // canonical → board mapping helper
function rotateHalfEdge(h: HalfEdge, rotation: Rotation): HalfEdge;
```

(Exact names/layout may vary — e.g. `packages/core/src/catalog/{types,loader,rotate,index}.ts` + `data/` re-exported from `packages/core/src/index.ts`.)

## Acceptance criteria

- [x] Catalog types (`SegmentType`, `Side`, `HalfEdge`, segment shapes, `TileDefinition`, `Catalog`) are defined and exported from `@carcassonne/core`.
- [x] `loadCatalog(tiles)` validates input and returns an indexed `Catalog` with `getTile`/`has`/`all`; it throws a typed `CatalogError` (never returns a malformed catalog).
- [x] The format expresses, for a tile: typed segments (city/road/field/monastery), pennants, per-segment `meepleable`, city/road **sides**, field **half-edges**, and field→city **adjacency** (`adjacentCities`).
- [x] `rotateSide` / `rotateHalfEdge` correctly map canonical orientation to a placed tile's rotation (0/90/180/270), verified by tests. (Consumes the Item 002 `Rotation` type.)
- [x] At least **two hand-written sample tiles** exist in the data folder and load successfully (e.g. a road-straight tile with two fields, and a city-with-pennant tile). They are samples for this item — **not** the full base game (that is Item 004).
- [x] Loader-level validation rejects obvious malformations (duplicate tile id, duplicate segment id within a tile, unknown segment type, a half-edge assigned to two field segments, `adjacentCities` referencing a non-existent city segment). (Comprehensive consistency suite is Item 005; this item provides the validation hooks + a few tests.)
- [x] No catalog↔board cyclic import; core platform boundary intact (`npm run build` green).

> Maps to Stage 1 deliverable "Tile catalog (base game): data-driven definition … in one authoritative source format" (format half; data is Item 004) and supports principle 2.

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/003/`.

## Implementation steps

1. Add `packages/core/src/catalog/types.ts` with the schema above.
2. Implement `loadCatalog` in `loader.ts` with validation + a typed `CatalogError`; index tiles by id.
3. Implement `rotateSide`/`rotateHalfEdge` in `rotate.ts` (pure functions over the Item 002 `Rotation`).
4. Add `packages/core/src/catalog/data/` with ≥2 sample `TileDefinition`s and a barrel that exports them as an array.
5. Re-export the public catalog API from `packages/core/src/index.ts`.
6. Write tests (see strategy); run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** unit tests in `packages/core/test/` (e.g. `catalog.test.ts`):
  - Loader indexes sample tiles; `getTile`/`has`/`all` behave; unknown id handling is defined (throw or `has` false).
  - Validation rejects each malformation listed in the acceptance criteria (one test each), throwing `CatalogError`.
  - `rotateSide`/`rotateHalfEdge` produce correct mappings for 0/90/180/270 (table-driven).
  - Sample tiles parse into the expected segment structure (spot-check a city pennant and a field's `adjacentCities`).
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 001 (scaffold), Item 002 (`Rotation`, `Side`/geometry conventions — reuse, don't duplicate).
- **Downstream:** Item 004 (authors full base-game data in this format), Item 005 (consistency suite over the catalog), Item 006 (feature extraction uses `getTile` + rotation helpers), Items 008–010 (scoring reads pennants/segment types), Stage 4 (farmers use field half-edges + `adjacentCities`).

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS recommended) and npm on PATH. No env vars, secrets, config, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (catalog suite green)
- [ ] Services started — N/A
- [ ] Application runs — N/A
- [x] Feature verified — catalog types/loader exported from `@carcassonne/core`; sample tiles load; malformations rejected
- [x] Data verified — sample tiles parse to expected segments; rotation helpers correct
- [ ] Health checks pass — N/A

**Expected Outcomes**
- Catalog format + `loadCatalog` + rotation helpers exported; `npm run lint && npm run build && npm test` exits 0.
- ≥2 sample tiles load; each listed malformation throws `CatalogError`.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: N/A
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [x] Screenshots captured: N/A

## Decisions & Trade-offs

### Side re-declaration to avoid cyclic imports

`catalog/types.ts` re-declares the `Side` type rather than importing it from `board/types.ts`. This prevents a cycle where the board module and catalog module mutually depend on each other. Only `rotate.ts` imports from the board module, and it imports only the `Rotation` type — a deliberate one-way dependency. The board module explicitly documents that it does not import the catalog. Trade-off: `Side` is defined in two places, but both definitions are identical string-literal unions and TypeScript's structural typing ensures they remain compatible.

### CatalogError uses a string-literal union kind, not an enum

`CatalogError.kind` is typed as a string-literal union (`"duplicate-tile-id" | "duplicate-segment-id" | ...`) rather than a TypeScript enum. This keeps the errors module dependency-free and makes error values JSON-serialisable without extra mapping. It also means callers can discriminate on `kind` with a plain `switch` and receive exhaustiveness checking from the compiler. Trade-off: typos in `kind` strings are a risk during authoring, mitigated by the type annotation.

### getTile throws rather than returning undefined

`getTile(id)` throws a `CatalogError("unknown-tile-id", ...)` for absent ids instead of returning `undefined`. This keeps the return type non-nullable (`TileDefinition`, not `TileDefinition | undefined`), simplifying call sites in the scoring engine and feature extractor. Callers who need a safe existence check can call `has(id)` first. Trade-off: callers that want to query speculatively must either call `has()` first or catch the error.

### all() returns a shallow copy

`all()` returns a shallow copy of the internal insertion-order array so callers cannot mutate the catalog's internal index by assigning into the returned array. Individual `TileDefinition` objects are not deep-cloned (they are treated as immutable data records). Trade-off: a caller that mutates a `TileDefinition` object in place would affect the catalog, but this was judged acceptable given the data-only nature of tile definitions.

### Sample tile half-edge coverage

`ROAD-STRAIGHT` assigns half-edges `["NW","WN","WS","SW"]` to the west field and `["NE","EN","ES","SE"]` to the east field, covering all 8 half-edges across two fields. The road occupies the N and S sides directly (no half-edges), splitting the tile into two fields. `CITY-PENNANT` places a city on the N and E sides and assigns the remaining 4 half-edges (`["SE","SW","WS","WN"]`) to a single field that references the city via `adjacentCities`. This design validates the `adjacentCities` mechanism and the half-edge completeness rule in a single sample tile.

## Completion Reminder

When complete, update [progress.md](../progress.md): this item delivers the **format** portion of the Stage 1 "Tile catalog" deliverable — note it in progress (the catalog deliverable becomes ✅ only once Item 004 populates the full base-game data). Stage 1 stays 🚧. Update only Item 003's rows; do not tick scoring/board criteria. Status flow: 📋 → 🚧 → ✅.
