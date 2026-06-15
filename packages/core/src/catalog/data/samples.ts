/**
 * Hand-written sample tile definitions for Item 003.
 *
 * These tiles demonstrate the catalog format and serve as test fixtures. They
 * are NOT the full base-game catalog (that is Item 004). Two tiles are defined:
 *
 *  ROAD-STRAIGHT   A road that runs straight N→S, splitting the tile into an
 *                  east field and a west field. Canonical orientation: road
 *                  enters from the north and exits to the south.
 *
 *  CITY-PENNANT    A city with a pennant that covers the north and east sides,
 *                  leaving a field in the south-west corner.
 */

import type { TileDefinition } from "../types.js";

/**
 * ROAD-STRAIGHT
 * ┌─────────┐
 * │    │    │   road: N and S sides (straight through)
 * │ f1 │ f2 │   f1 = west field (WN, WS, NW, SW)
 * │    │    │   f2 = east field (NE, EN, ES, SE)
 * └─────────┘
 */
const roadStraight: TileDefinition = {
  id: "ROAD-STRAIGHT",
  count: 8,
  segments: [
    {
      id: "r1",
      type: "road",
      sides: ["N", "S"],
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // West field: the western half of the north side + entire west side +
      // the western half of the south side.
      halfEdges: ["NW", "WN", "WS", "SW"],
      adjacentCities: [],
      meepleable: true,
    },
    {
      id: "f2",
      type: "field",
      // East field: the eastern half of the north side + entire east side +
      // the eastern half of the south side.
      halfEdges: ["NE", "EN", "ES", "SE"],
      adjacentCities: [],
      meepleable: true,
    },
  ],
};

/**
 * CITY-PENNANT
 * ┌─────────┐
 * │ CITY    │   city: N and E sides, with a pennant
 * │  c1 ╔══╣
 * │    ╔╝  │   f1 = south-west field
 * └────┘───┘
 *   f1
 *
 * Field half-edges: SW corner covers SE, SW, WS, WN (south and west sides).
 */
const cityPennant: TileDefinition = {
  id: "CITY-PENNANT",
  count: 2,
  segments: [
    {
      id: "c1",
      type: "city",
      sides: ["N", "E"],
      pennant: true,
      meepleable: true,
    },
    {
      id: "f1",
      type: "field",
      // The south and west sides are all field (city does not touch S or W).
      halfEdges: ["SE", "SW", "WS", "WN"],
      adjacentCities: ["c1"],
      meepleable: true,
    },
  ],
};

/** All sample tile definitions exported as an ordered array. */
export const sampleTiles: TileDefinition[] = [roadStraight, cityPennant];
