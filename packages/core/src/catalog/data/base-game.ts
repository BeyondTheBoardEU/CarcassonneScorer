/**
 * Base-game tile catalog data — all 24 distinct tile types (A–X).
 *
 * Each tile is authored in its canonical (unrotated) orientation following the
 * conventions established in samples.ts and the Item 003 half-edge model:
 *
 *   • City sides consume both their half-edges (those half-edges appear in NO
 *     field segment).
 *   • Road sides split their two half-edges between the two flanking field
 *     segments (the road takes the side; the fields take the half-edges).
 *   • Pure field sides contribute both half-edges to the adjacent field segment.
 *   • adjacentCities lists local city-segment ids for every field that borders
 *     a city.
 *   • pennant: true only on tiles C, F, M, O, Q, S.
 *   • meepleable: true on every segment (all base-game features are placeable).
 *   • count records the number of physical copies in the 72-tile base set.
 *
 * Half-edge layout (clockwise from NW corner):
 *   N side: NW → NE
 *   E side: EN → ES
 *   S side: SE → SW
 *   W side: WS → WN
 */

import type { TileDefinition } from "../types.js";
import { loadCatalog } from "../loader.js";

// ---------------------------------------------------------------------------
// A — Cloister with road to the south  (2 copies)
//
//  ┌─────────┐
//  │  [mon]  │   monastery in the centre
//  │         │   road exits south (S side only)
//  │    f1   │   f1 = one connected field wrapping N, E, W and both halves of S
//  └────┼────┘
//       road S
//
// Canonical orientation: road exits on the S side. N, E, W = field.
// The road on S has only one side; the field wraps around the whole tile.
// Road on S splits: SE and SW both belong to the same surrounding field (f1)
// because the field connects around N, E, W uninterrupted.
// ---------------------------------------------------------------------------
const tileA: TileDefinition = {
  id: "BASE-A",
  count: 2,
  segments: [
    {
      id: "mon",
      type: "monastery",
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // All half-edges: the field wraps around N, E, W, and both halves of S
      // (the road only exits to S so the field is one connected region)
      halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// B — Cloister alone (field all around)  (4 copies)
//
//  ┌─────────┐
//  │  [mon]  │   monastery in centre; all four sides are field
//  └─────────┘
// ---------------------------------------------------------------------------
const tileB: TileDefinition = {
  id: "BASE-B",
  count: 4,
  segments: [
    {
      id: "mon",
      type: "monastery",
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// C — City filling the whole tile (pennant)  (1 copy)
//
//  ┌─────────┐
//  │  CITY   │   one city segment covering all four sides
//  │    ✓    │   pennant = true
//  └─────────┘
//
// All four sides are city; no field half-edges remain.
// ---------------------------------------------------------------------------
const tileC: TileDefinition = {
  id: "BASE-C",
  count: 1,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "E", "S", "W"],
      pennant: true,
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// D — City cap north + straight road E↔W  (start tile, 4 copies)
//
//  ┌─────────┐
//  │  CITY   │   city: N side
//  ╠══════════╣   road: E and W sides (straight through)
//  │   f-s   │   f-n = north field (between city wall and road)
//  └─────────┘   f-s = south field (below the road)
//
// The road runs straight from E to W, dividing the tile into:
//   f-n = narrow strip between city (N) and road: EN + WN
//   f-s = large south area below road: ES + SE + SW + WS
// Both border the city (f-n directly, f-s via the road gap).
//
// Wait — actually in the standard game, for the D tile (city N + road E-W):
// The city wall is on N, the road runs through the centre E to W.
// The field NORTH of the road (between city and road) and the field SOUTH
// of the road are two separate connected regions separated by the road.
// f-n borders the city; f-s does NOT border the city (the road separates them).
// ---------------------------------------------------------------------------
const tileD: TileDefinition = {
  id: "BASE-D",
  count: 4,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["E", "W"],
      meepleable: true,
    },
    {
      id: "f-n",
      type: "field",
      // North strip between city wall and road: north half of E (EN) + north half of W (WN)
      halfEdges: ["EN", "WN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f-s",
      type: "field",
      // South area below road: south half of E (ES) + full S side (SE, SW) + south half of W (WS)
      halfEdges: ["ES", "SE", "SW", "WS"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// E — City cap on north, field elsewhere  (5 copies)
//
//  ┌─────────┐
//  │  CITY   │   city: N side only
//  ├─────────┤   remaining three sides all field
//  │   f1    │
//  └─────────┘
// ---------------------------------------------------------------------------
const tileE: TileDefinition = {
  id: "BASE-E",
  count: 5,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // E, S, W sides are all field. N is city (NW, NE consumed).
      halfEdges: ["EN", "ES", "SE", "SW", "WS", "WN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// F — City across two opposite sides (N+S), connected, pennant  (2 copies)
//
//  ┌─────────┐
//  │  CITY   │   city: N and S sides, connected through-city
//  │  ✓      │   pennant = true
//  │  CITY   │   E and W sides are field
//  └─────────┘
//
// The city bridges N and S; the E and W sides are the two separated fields.
// f1 = west field, f2 = east field.
// Both border the city.
// ---------------------------------------------------------------------------
const tileF: TileDefinition = {
  id: "BASE-F",
  count: 2,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "S"],
      pennant: true,
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // West field: full W side
      halfEdges: ["WS", "WN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      // East field: full E side
      halfEdges: ["EN", "ES"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// G — City across two opposite sides (N+S), connected, no pennant  (1 copy)
//
// Same layout as F but without pennant.
// ---------------------------------------------------------------------------
const tileG: TileDefinition = {
  id: "BASE-G",
  count: 1,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      halfEdges: ["WS", "WN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      halfEdges: ["EN", "ES"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// H — Two separate city caps on opposite sides (N+S), NOT connected  (3 copies)
//
//  ┌─────────┐
//  │ CITY-N  │   city1: N side only
//  ├─────────┤
//  │   f1    │   one open field in the middle (E and W sides)
//  ├─────────┤
//  │ CITY-S  │   city2: S side only
//  └─────────┘
//
// f1 is bordered by both city1 and city2.
// ---------------------------------------------------------------------------
const tileH: TileDefinition = {
  id: "BASE-H",
  count: 3,
  segments: [
    {
      id: "city1",
      type: "city",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "city2",
      type: "city",
      sides: ["S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // E and W sides are field; N and S are city (NW, NE, SE, SW consumed)
      halfEdges: ["EN", "ES", "WS", "WN"],
      adjacentCities: ["city1", "city2"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// I — Two separate city caps on adjacent sides (N+E), NOT connected  (2 copies)
//
//  ┌─────────┐
//  │ CITY-N  │   city1: N side only
//  │      ╔══╣   city2: E side only  (separate, no connection)
//  │  f1  ║  │
//  └──────╝──┘
//
// f1 = south-west field (S and W sides), bordering both cities.
// ---------------------------------------------------------------------------
const tileI: TileDefinition = {
  id: "BASE-I",
  count: 2,
  segments: [
    {
      id: "city1",
      type: "city",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "city2",
      type: "city",
      sides: ["E"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // S and W sides are field; N and E are city (NW, NE, EN, ES consumed)
      halfEdges: ["SE", "SW", "WS", "WN"],
      adjacentCities: ["city1", "city2"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// J — City cap north + road turning from S to E  (3 copies)
//
//  ┌─────────┐
//  │  CITY   │   city: N side
//  │      ╔══╣   road: S side and E side (road curves from S to E)
//  │  f1  ║  │   f1 = west-and-centre field
//  └──────╝──┘   f2 = small SE corner field (between road and corners)
//
// Road on S splits: SE → f2, SW → f1
// Road on E splits: EN → f1 (north of road, south of city), ES → f2
//
// Wait — J is "city cap + road turning (enters one open side, exits adjacent)".
// Let me use: city N, road from S to E.
// f1 = west field (entire W side + north-of-road on E = EN, south-west of S = SW)
// f2 = south-east corner (ES, SE)
// f1 borders the city; f2 does not border the city.
// ---------------------------------------------------------------------------
const tileJ: TileDefinition = {
  id: "BASE-J",
  count: 3,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["S", "E"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // West field + area between city and road arc:
      // W side: WS, WN; north half of E (EN) — above the road; SW half of S — left of road
      halfEdges: ["WS", "WN", "EN", "SW"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      // South-east corner: ES (south half of E), SE (east half of S)
      halfEdges: ["ES", "SE"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// K — City cap north + road turning from W to S  (3 copies)
//
// Mirror of J: city N, road curving from W to S (through SW corner).
// Road on W splits: WN → f1 (large field, north of road), WS → f2 (SW corner)
// Road on S splits: SW → f2 (SW corner), SE → f1 (large field)
// f1 = large field (outside the curve): WN, EN, ES, SE — borders city
// f2 = small SW corner (inside the curve): WS, SW — no city adjacency
// ---------------------------------------------------------------------------
const tileK: TileDefinition = {
  id: "BASE-K",
  count: 3,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["W", "S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // Large field outside the road curve: north half of W (WN) + full E side + SE half of S
      halfEdges: ["WN", "EN", "ES", "SE"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      // Small SW corner (inside the curve): WS (south half of W) + SW (west half of S)
      halfEdges: ["WS", "SW"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// L — City cap north + road T-junction (three arms: E, S, W)  (3 copies)
//
//  ┌─────────┐
//  │  CITY   │   city: N side
//  ╠════╬════╣   road arms: E, S, W (three separate road segments)
//  │ f1 │ f2 │   fields between road arms
//  └────┴────┘
//
// Three separate road segments (crossroads-style), one per arm.
// Fields:
//   f1 = between W arm and S arm (SW quadrant): WN (north of W = near city), SW (west of S)
//   f2 = between S arm and E arm (SE quadrant): SE (east of S), ES (south of E)
//   f3 = between E arm and (city) (NE quadrant): EN (north of E)
//   f4 = between (city) and W arm (NW quadrant): WS? No wait...
//
// Actually for an L tile (city N + T-junction with arms going E, S, W):
// The centre junction is a crossroads connecting E, S, W roads.
// Road-W splits W side: WS → f-SW, WN → f-NW
// Road-S splits S side: SE → f-SE, SW → f-SW
// Road-E splits E side: EN → f-NE, ES → f-SE
//
// Fields:
//   f-NW: between city (N) and W-road arm. Only WN half-edge.
//         Borders city (yes, touches city to north, road to south and east).
//   f-SW: between W-road arm and S-road arm. WS + SW.
//         No city adjacency.
//   f-SE: between S-road arm and E-road arm. SE + ES.
//         No city adjacency.
//   f-NE: between E-road arm and city (N). EN.
//         Borders city.
// ---------------------------------------------------------------------------
const tileL: TileDefinition = {
  id: "BASE-L",
  count: 3,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "road-e",
      type: "road",
      sides: ["E"],
      meepleable: true,
    },
    {
      id: "road-s",
      type: "road",
      sides: ["S"],
      meepleable: true,
    },
    {
      id: "road-w",
      type: "road",
      sides: ["W"],
      meepleable: true,
    },
    {
      id: "f-nw",
      type: "field",
      // North of W arm, south of city
      halfEdges: ["WN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f-sw",
      type: "field",
      // South of W arm + west of S arm
      halfEdges: ["WS", "SW"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-se",
      type: "field",
      // East of S arm + south of E arm
      halfEdges: ["SE", "ES"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-ne",
      type: "field",
      // North of E arm, south of city
      halfEdges: ["EN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// M — City corner (N+W connected), pennant  (2 copies)
//
//  ┌─────────┐
//  │ CITY    │   city: N and W sides, connected (L-shape in NW)
//  ╠══╗      │   pennant = true
//  ║  ║  f1  │
//  └──╝──────┘
//
// f1 = south-east field (E + S sides), borders the city.
// ---------------------------------------------------------------------------
const tileM: TileDefinition = {
  id: "BASE-M",
  count: 2,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "W"],
      pennant: true,
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // E and S sides are field; N and W are city (NW, NE, WS, WN consumed)
      halfEdges: ["EN", "ES", "SE", "SW"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// N — City corner (N+W connected), no pennant  (3 copies)
//
// Same layout as M without pennant.
// ---------------------------------------------------------------------------
const tileN: TileDefinition = {
  id: "BASE-N",
  count: 3,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "W"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      halfEdges: ["EN", "ES", "SE", "SW"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// O — City corner (N+W) + road across S and E sides, pennant  (2 copies)
//
//  ┌─────────┐
//  │ CITY ✓  │   city: N and W, connected, pennant
//  ╠══╗   ╔══╣   road: S and E sides (road curves from S to E)
//  ║  ║f1 ║  │
//  └──╝───╝──┘
//                 Wait — if city is N+W and road is S+E, then:
//                 f1 = interior field (between city and road)
//                 f2 = outer field (south of S-road arm? no road has two sides)
//
// The road curves from S to E (or E to S). There is one road segment with
// sides [S, E]. The city is NW corner. There's a single interior field between
// the NW city and the SE road curve, and a tiny exterior corner — but wait,
// looking at actual Carcassonne tiles:
//
// O tile: city corner NW (N+W), road enters S and exits E (or vice versa).
// This creates two fields:
//   f1 = inner field (in the SW to NE diagonal area, between the road and city)
//   f2 = outer SE corner field (east of the S road half and south of the E road half)
//
// Road on S splits: SE → f2, SW → f1
// Road on E splits: EN → f1, ES → f2
//
// f1 borders the city (touches NW city wall to the north/west).
// f2 does not border the city.
// ---------------------------------------------------------------------------
const tileO: TileDefinition = {
  id: "BASE-O",
  count: 2,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "W"],
      pennant: true,
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["S", "E"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // Interior: SW half of S (between city wall and road curve) + north half of E (EN)
      halfEdges: ["SW", "EN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      // Outer SE corner: SE half of S + ES half of E
      halfEdges: ["SE", "ES"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// P — City corner (N+W) + road across S and E sides, no pennant  (3 copies)
//
// Same layout as O without pennant.
// ---------------------------------------------------------------------------
const tileP: TileDefinition = {
  id: "BASE-P",
  count: 3,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "W"],
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["S", "E"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      halfEdges: ["SW", "EN"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      halfEdges: ["SE", "ES"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Q — City on three sides (N+E+W, connected), pennant  (1 copy)
//
//  ╔═════════╗
//  ║  CITY ✓ ║   city: N, E, W sides, connected
//  ║         ║   pennant = true
//  ╚══╗   ╔══╝   open side: S (field)
//     │ f1│
//
// f1 = south field, borders city.
// Road on S: none — S is pure field.
// ---------------------------------------------------------------------------
const tileQ: TileDefinition = {
  id: "BASE-Q",
  count: 1,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "E", "W"],
      pennant: true,
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // Only S side is field; N, E, W consumed by city (NW, NE, EN, ES, WS, WN consumed)
      halfEdges: ["SE", "SW"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// R — City on three sides (N+E+W, connected), no pennant  (3 copies)
//
// Same layout as Q without pennant.
// ---------------------------------------------------------------------------
const tileR: TileDefinition = {
  id: "BASE-R",
  count: 3,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "E", "W"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      halfEdges: ["SE", "SW"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// S — City on three sides (N+E+W) + road exiting south, pennant  (2 copies)
//
//  ╔═════════╗
//  ║  CITY ✓ ║   city: N, E, W sides, connected, pennant
//  ╚══╗│╔═══╝   road: S side (exits south)
//     │↓│       f1 = west of road, f2 = east of road
//
// Road on S splits: SE → f2, SW → f1.
// f1 and f2 both border the city (they are enclosed by city on three sides).
// ---------------------------------------------------------------------------
const tileS: TileDefinition = {
  id: "BASE-S",
  count: 2,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "E", "W"],
      pennant: true,
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // SW half of S (west of road)
      halfEdges: ["SW"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      // SE half of S (east of road)
      halfEdges: ["SE"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// T — City on three sides (N+E+W) + road exiting south, no pennant  (1 copy)
//
// Same layout as S without pennant.
// ---------------------------------------------------------------------------
const tileT: TileDefinition = {
  id: "BASE-T",
  count: 1,
  segments: [
    {
      id: "city",
      type: "city",
      sides: ["N", "E", "W"],
      meepleable: true,
    },
    {
      id: "road",
      type: "road",
      sides: ["S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      halfEdges: ["SW"],
      adjacentCities: ["city"],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      halfEdges: ["SE"],
      adjacentCities: ["city"],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// U — Road straight N↔S  (8 copies)
//
// This tile matches the "ROAD-STRAIGHT" sample in samples.ts but uses a
// stable BASE-U id. The sample tile is kept separate for backward
// compatibility with Item 003 tests.
//
//  ┌─────────┐
//  │    │    │   road: N and S sides (straight through)
//  │ f1 │ f2 │   f1 = west field, f2 = east field
//  │    │    │
//  └─────────┘
// ---------------------------------------------------------------------------
const tileU: TileDefinition = {
  id: "BASE-U",
  count: 8,
  segments: [
    {
      id: "road",
      type: "road",
      sides: ["N", "S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // West field: NW (west half of N), full W side (WN, WS), SW (west half of S)
      halfEdges: ["NW", "WN", "WS", "SW"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      // East field: NE (east half of N), full E side (EN, ES), SE (east half of S)
      halfEdges: ["NE", "EN", "ES", "SE"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// V — Road curve N→W (or equivalently, road enters N and exits W)  (9 copies)
//
//  ┌────┐────┐
//  │    ↓    │   road: N and W sides (curves from N to W)
//  │    └────┘
//  │  f2  f1 │   f1 = inner corner (NE, EN, ES, SE — enclosed by road curve)
//  └─────────┘   f2 = outer area (SW, WS — the remaining field beyond the road)
//
// Wait, the road enters N and exits W. The road curves in the NW region.
// The field inside the curve (NE, inner) is f1.
// The field outside (SW corner) is f2.
//
// Road on N splits: NW → f2 (west of road, outside curve), NE → f1 (east, inside curve)
// Road on W splits: WS → f2 (south of road, outside curve), WN → f1 (north, inside curve)
//
// Hmm, let me re-think. The road curves from N to W (in the NW corner).
// - Inside the road curve (NE/SE region): f1 = the big field
// - Outside the road curve (SW region): f2 = the small corner field
//
// Actually V is a curve. The road goes from one side to an adjacent side.
// Let's say road goes from N to W (curves through NW corner).
// Inside the curve (the NE, E, S, SW region) = big field.
// Outside the curve (tiny NW corner outside the road) = small field.
//
// Road on N splits: NW → f-outside (tiny corner), NE → f-inside (big field)
// Road on W splits: WS → f-inside (big field), WN → f-outside (tiny corner)
//
// f-inside: NE, EN, ES, SE, SW, WS (everything except the NW corner)
// f-outside: NW, WN (just the NW corner)
//
// Neither f-inside nor f-outside borders a city.
// ---------------------------------------------------------------------------
const tileV: TileDefinition = {
  id: "BASE-V",
  count: 9,
  segments: [
    {
      id: "road",
      type: "road",
      sides: ["N", "W"],
      meepleable: true,
    },
    {
      id: "f-in",
      type: "field",
      // Large inner field (inside the road curve): NE + full E side + full S side + WS
      halfEdges: ["NE", "EN", "ES", "SE", "SW", "WS"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-out",
      type: "field",
      // Small outer corner (outside the road curve in NW): NW + WN
      halfEdges: ["NW", "WN"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// W — Road T-junction (three arms: N, E, S — or equivalently N, S, W)  (4 copies)
//
// Three separate road segments radiating from centre; canonical: arms N, E, S.
// Fields:
//   f-ne: NE + EN (between N-arm and E-arm, east of N, north of E)
//   f-se: ES + SE (between E-arm and S-arm, south of E, east of S)
//   f-sw: SW + WS + WN + NW (between S-arm, W side, and N-arm)
//
// Road-N splits N side: NW → f-sw, NE → f-ne
// Road-E splits E side: EN → f-ne, ES → f-se
// Road-S splits S side: SE → f-se, SW → f-sw
// Full W side (no road): WS → f-sw, WN → f-sw
// ---------------------------------------------------------------------------
const tileW: TileDefinition = {
  id: "BASE-W",
  count: 4,
  segments: [
    {
      id: "road-n",
      type: "road",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "road-e",
      type: "road",
      sides: ["E"],
      meepleable: true,
    },
    {
      id: "road-s",
      type: "road",
      sides: ["S"],
      meepleable: true,
    },
    {
      id: "f-ne",
      type: "field",
      halfEdges: ["NE", "EN"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-se",
      type: "field",
      halfEdges: ["ES", "SE"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-sw",
      type: "field",
      // SW + full W + NW (the large field on the western side)
      halfEdges: ["SW", "WS", "WN", "NW"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// X — Road crossroads (four arms: N, E, S, W)  (1 copy)
//
// Four separate road segments; four small corner fields between them.
// Road-N splits N: NW → f-nw, NE → f-ne
// Road-E splits E: EN → f-ne, ES → f-se
// Road-S splits S: SE → f-se, SW → f-sw
// Road-W splits W: WS → f-sw, WN → f-nw
// ---------------------------------------------------------------------------
const tileX: TileDefinition = {
  id: "BASE-X",
  count: 1,
  segments: [
    {
      id: "road-n",
      type: "road",
      sides: ["N"],
      meepleable: true,
    },
    {
      id: "road-e",
      type: "road",
      sides: ["E"],
      meepleable: true,
    },
    {
      id: "road-s",
      type: "road",
      sides: ["S"],
      meepleable: true,
    },
    {
      id: "road-w",
      type: "road",
      sides: ["W"],
      meepleable: true,
    },
    {
      id: "f-nw",
      type: "field",
      halfEdges: ["NW", "WN"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-ne",
      type: "field",
      halfEdges: ["NE", "EN"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-se",
      type: "field",
      halfEdges: ["ES", "SE"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f-sw",
      type: "field",
      halfEdges: ["SW", "WS"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Ordered array of all 24 base-game tile definitions (A–X).
// ---------------------------------------------------------------------------

/** All 24 base-game tile type definitions in A–X order. */
export const baseGameTiles: TileDefinition[] = [
  tileA,
  tileB,
  tileC,
  tileD,
  tileE,
  tileF,
  tileG,
  tileH,
  tileI,
  tileJ,
  tileK,
  tileL,
  tileM,
  tileN,
  tileO,
  tileP,
  tileQ,
  tileR,
  tileS,
  tileT,
  tileU,
  tileV,
  tileW,
  tileX,
];

/**
 * Ready-loaded base-game catalog.
 *
 * Constructed at module load time; throws `CatalogError` immediately if any
 * tile definition is malformed (catches authoring bugs at import time during
 * tests/build).
 */
export const baseGameCatalog = loadCatalog(baseGameTiles);
