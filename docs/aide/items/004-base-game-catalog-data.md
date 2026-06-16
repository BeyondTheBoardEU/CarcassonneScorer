# Item 004 — Base-game tile catalog data

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-15

---

## Description

Author the **complete base-game tile set** as data in the Item 003 catalog format: every distinct base-game tile type, expressed as typed segments (city / road / field / monastery) with sides, field half-edges, field→city adjacency, pennants, and `meepleable` flags. The result is the full base-game catalog, loadable by the core via `loadCatalog`, and exported from `@carcassonne/core`.

This populates the **data** half of the Stage 1 "Tile catalog (base game)" deliverable (Item 003 delivered the format/loader). It is vision principle 2 made real: one authoritative catalog the scoring engine (Items 006–010), the consistency suite (Item 005), and later recognition/validation all consume. Tile counts/multiplicity may be recorded but are **not** required for scoring from an explicit board state.

This item authors data only — it adds no new schema, loader, or scoring logic. The **comprehensive** internal-consistency test suite (half-edge coverage completeness, cross-tile symmetry, etc.) is **Item 005**; this item provides the data plus enough tests to prove it loads and is structurally sane.

## Design decisions (decided here)

- **Canonical orientation per tile.** Each tile is authored in one fixed canonical (unrotated) orientation, consistent with Item 003. Rotation is applied at scoring time via `rotateSide`/`rotateHalfEdge`; the data never stores rotated variants.
- **Stable, human-readable tile ids.** Use the standard A–X base-game letter codes as a stable id prefix so cross-references (tests, docs, Item 005, recognition) are unambiguous — e.g. `"BASE-A-CLOISTER-ROAD"`, `"BASE-U-ROAD-STRAIGHT"`. Ids are unique across the set (loader enforces this).
- **Side/field discipline.** For every tile, each of the four sides is accounted for: a side carrying a city or road is referenced by that segment's `sides`; the remaining side portions are covered by field `halfEdges`. A side split by a road (e.g. a road meeting that side) divides into its two half-edges across two fields. (Item 005 will assert full coverage automatically; author it correctly here.)
- **Fields and `adjacentCities`.** Each field segment lists the local city-segment ids it borders, so Stage 4 farmer scoring can count completed bordering cities. A field that borders no city has `adjacentCities: []`.
- **Pennants.** Set `pennant: true` only on the city segments that bear a pennant in the standard base-game art (the pennant tiles are enumerated in the table below).
- **Meepleable.** All base-game city, road, field, and monastery segments are placeable → `meepleable: true` for every segment in this set. (The flag exists for later expansions with non-placeable features.)
- **Counts are informational.** Record each tile's `count` (copies in the 72-tile base set) for later deck/setup use. Scoring never reads it; Item 005 may assert the totals.
- **Authoring location.** Add the data under `packages/core/src/catalog/data/` (e.g. `base-game.ts`), re-exported through the existing `data/index.ts` barrel and surfaced from `packages/core/src/index.ts` as a `baseGameTiles` array and a ready-loaded `baseGameCatalog`. Keep the Item 003 `sampleTiles` intact (used by existing tests).

## Canonical base-game tile set (reference)

The standard base game is **24 distinct tile types** totalling **72 tiles** (including the start tile, a type-D). Author all 24. Counts below are the widely documented distribution; **verify segment geometry against a reliable reference** (e.g. the official rules / Carcassonne wiki tile images). If a trustworthy source disagrees on a count, prefer it and note the deviation in Decisions — but all 24 distinct **types** must be present.

| Code | Description | Pennant | Count |
|------|-------------|:------:|:-----:|
| A | Cloister (monastery) with a single road to one side | — | 2 |
| B | Cloister (monastery) alone, field all around | — | 4 |
| C | City filling the whole tile (all 4 sides, connected) | ✓ | 1 |
| D | City on one side + straight road through the other two sides (**start tile**) | — | 4 |
| E | City cap on one side, field elsewhere | — | 5 |
| F | City across two opposite sides, connected | ✓ | 2 |
| G | City across two opposite sides, connected | — | 1 |
| H | City on two opposite sides, **not** connected (two cities), field between | — | 3 |
| I | City on two adjacent sides, **not** connected (two cities) | — | 2 |
| J | City cap + road turning (enters one open side, exits the adjacent one) | — | 3 |
| K | City cap + road turning (mirror of J) | — | 3 |
| L | City cap + road junction (T of roads meeting below the city) | — | 3 |
| M | City on two adjacent sides, connected (corner) | ✓ | 2 |
| N | City on two adjacent sides, connected (corner) | — | 3 |
| O | City corner (two adjacent, connected) + road across the other two sides | ✓ | 2 |
| P | City corner (two adjacent, connected) + road across the other two sides | — | 3 |
| Q | City on three sides, connected | ✓ | 1 |
| R | City on three sides, connected | — | 3 |
| S | City on three sides, connected + road exiting the open (fourth) side | ✓ | 2 |
| T | City on three sides, connected + road exiting the open side | — | 1 |
| U | Road straight (through two opposite sides) | — | 8 |
| V | Road curve (between two adjacent sides) | — | 9 |
| W | Road T-junction (three roads meet) | — | 4 |
| X | Road crossroads (four roads meet) | — | 1 |
| | **Total** | | **72** |

Notes for modelling:
- **Crossroads/junctions (W, X, L, and the J/K turns)** have **multiple road segments** — each road arm is its own `RoadSegment` with a single side (they meet at the centre, not connected as one road for scoring).
- **Separate-city tiles (H, I)** have **two distinct city segments**, each with its own id.
- **Monastery tiles (A, B)** have one `MonasterySegment` plus the surrounding field (and, for A, a road segment).
- A field bordering a city must list that city in `adjacentCities`; a field enclosed by the open interior of a multi-side city still borders it.

## Acceptance criteria

- [x] All **24 distinct** base-game tile types (codes A–X above) exist as `TileDefinition`s under `packages/core/src/catalog/data/`, each with a unique stable id.
- [x] A `baseGameTiles` array and a ready-loaded `baseGameCatalog` (`loadCatalog(baseGameTiles)`) are exported from `@carcassonne/core`.
- [x] `loadCatalog(baseGameTiles)` **succeeds without throwing** — i.e. the entire base-game data set passes all Item 003 validations (unique tile/segment ids, known types, no duplicated half-edge, valid `adjacentCities`).
- [x] Every tile models its segments correctly: city/road segments reference their `sides`; field segments cover the remaining side portions via `halfEdges`; pennants set **only** on the pennant tiles (C, F, M, O, Q, S); monastery tiles carry a `MonasterySegment`; every segment is `meepleable: true`.
- [x] Each tile records a `count`; the counts sum to **72** (informational, asserted by test).
- [x] Tests prove the data loads and spot-check representative tiles (see Testing strategy). `npm run lint && npm run build && npm test` exits 0.
- [x] The Item 003 `sampleTiles` and their tests remain intact; no schema/loader changes; no catalog↔board cyclic import.

> Maps to Stage 1 deliverable "Tile catalog (base game): data-driven definition of every base-game tile … in one authoritative source format" (the **data** half; format was Item 003). Comprehensive consistency assertions are **Item 005**.

## Implementation steps

1. Read the Item 003 format: `packages/core/src/catalog/types.ts`, `loader.ts`, and the existing `data/samples.ts` for the modelling conventions (half-edge naming, field/adjacency, pennants).
2. Create `packages/core/src/catalog/data/base-game.ts` defining all 24 tile types (A–X) as `TileDefinition`s with `count`s. Group/comment by feature family for readability.
3. Export `baseGameTiles` (ordered array) and `baseGameCatalog = loadCatalog(baseGameTiles)` from the data barrel and re-export from `packages/core/src/index.ts`.
4. Add tests in `packages/core/test/` (e.g. `base-game-catalog.test.ts`): load assertion, distinct-type count, count-sum, and spot-checks (see strategy).
5. Run `npm run lint && npm run build && npm test` until green. Record any geometry/count deviations in Decisions & Trade-offs.

## Testing strategy

- **Vitest** unit tests in `packages/core/test/base-game-catalog.test.ts`:
  - `loadCatalog(baseGameTiles)` does not throw; `baseGameCatalog.all()` returns 24 tiles; ids are unique.
  - Sum of every tile's `count` equals 72.
  - Spot-checks on representative tiles, asserting exact segment structure:
    - **B** (cloister alone): one `monastery` segment + one field covering all 8 half-edges; no city/road.
    - **A** (cloister + road): monastery + one road segment (one side) + field; road `meepleable`.
    - **C** (full city + pennant): one city segment over all four sides with `pennant: true`; no field half-edges left.
    - **X** (crossroads): four separate road segments, fields between them.
    - **U** (straight road): matches the existing sample's shape (road N/S + two fields) — or document why the base id differs from the sample id.
    - One pennant city-corner (**M**) and one three-sided city (**Q/R**) to exercise `adjacentCities`.
  - A guard test that every pennant tile (C, F, M, O, Q, S) has exactly one pennanted city segment and no other tile sets `pennant: true`.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 003 (catalog format, `loadCatalog`, segment types, half-edge model) — reuse exactly; do not modify. Item 002 (`Rotation`, geometry conventions) is reused transitively via Item 003.
- **Downstream:** Item 005 (comprehensive consistency suite over this data), Item 006 (feature extraction reads these tiles), Items 008–010 (scoring reads pennants/segment types), Stage 4 (farmers use field half-edges + `adjacentCities`).

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript data + tests.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (base-game catalog suite green; existing suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — `baseGameTiles`/`baseGameCatalog` exported from `@carcassonne/core`; 24 tiles load; counts sum to 72
- [x] Data verified — spot-checked tiles (B, A, C, X, M, Q/R) have the expected segment structure; pennants only on C/F/M/O/Q/S
- [x] Health checks pass — N/A

**Expected Outcomes**
- All 24 base-game tile types authored and loadable; `loadCatalog(baseGameTiles)` returns a catalog of 24 tiles with no error.
- `npm run lint && npm run build && npm test` exits 0; counts sum to 72.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: N/A
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [x] Screenshots captured: N/A

## Decisions & Trade-offs

**Tile A field topology.** The road exits only one side (S), so the surrounding field is one connected region. All 8 half-edges are assigned to a single field segment `f1`. The field wraps around N, E, W, and both halves of S because the road never crosses to a second side and therefore never isolates the west-of-road area from the east-of-road area via the remaining sides.

**Tile D field topology (start tile).** City occupies N; a straight road runs E–W. This creates two distinct fields: `f-n` (the strip between the city wall and the road, half-edges EN + WN, adjacent to the city) and `f-s` (the large area south of the road, half-edges ES + SE + SW + WS, no city adjacency). The road acts as a barrier separating the two fields; `f-s` is not adjacent to the city even though the city borders the same tile.

**Tile K field topology (mirror of J).** The road curves from W to S, passing through the SW corner. This creates exactly two fields: `f1` (the large outer arc: WN, EN, ES, SE — borders the city cap on N) and `f2` (the small SW corner inside the curve: WS, SW — no city adjacency). An earlier draft modelled three fields, but that was incorrect: the road curve does not split the outer arc.

**Tile V canonical orientation.** The road curve enters N and exits W, curving through the NW corner. This yields two fields: `f-in` (the large inner area: NE, EN, ES, SE, SW, WS — 6 half-edges) and `f-out` (the tiny outer NW corner: NW, WN — 2 half-edges). Neither field is adjacent to a city.

**Tile W canonical orientation.** T-junction with open road arms N, E, S; the W side is all field. This produces three fields: `f-ne` (NE + EN), `f-se` (ES + SE), and `f-sw` (the large western area: SW + WS + WN + NW). Each pair of adjacent road arms isolates a corner field between them; the full W side plus the two inner corners of the SW and NW quadrants form one connected western field.

**Stable `BASE-` id scheme.** Tile ids use the prefix `BASE-` followed by the standard single-letter code (BASE-A through BASE-X). This satisfies the spec's human-readable, stable id requirement, avoids any collision with Item 003 sample tile ids (ROAD-STRAIGHT, CITY-PENNANT, etc.), and makes cross-references in tests, Item 005, and future recognition code unambiguous. The loader enforces uniqueness at load time.

**Count source.** Counts match the widely documented 72-tile base-game distribution given in the spec reference table exactly. No deviations were found relative to that table; the sum 2+4+1+4+5+2+1+3+2+3+3+3+2+3+2+3+1+3+2+1+8+9+4+1 = 72 is asserted by test.

## Completion Reminder

When complete, update [progress.md](../progress.md): with Item 003 (format) **and** Item 004 (data) both done, the Stage 1 **"Tile catalog (base game)"** deliverable becomes **✅**. Stage 1 stays 🚧 In Progress (scoring engine + tests remain). Do not tick scoring/board acceptance criteria. Status flow for this item: 📋 → 🚧 → ✅.
