/**
 * Rotation helpers for the tile catalog.
 *
 * The catalog stores tiles in their canonical (0°, unrotated) orientation. When
 * a tile is placed on the board with a given `Rotation`, these helpers map
 * canonical sides and half-edges to their actual board directions.
 *
 * Rotation is clockwise, matching the board module's `Rotation` type:
 *   0   → no change
 *   90  → N→E, E→S, S→W, W→N
 *   180 → N→S, E→W, S→N, W→E
 *   270 → N→W, W→S, S→E, E→N
 */

import type { Rotation } from "../board/types.js";
import type { HalfEdge, Side } from "./types.js";

// ---------------------------------------------------------------------------
// Side rotation
// ---------------------------------------------------------------------------

/** Clockwise rotation tables for sides. */
const SIDE_ROTATION: Record<Rotation, Record<Side, Side>> = {
  0: { N: "N", E: "E", S: "S", W: "W" },
  90: { N: "E", E: "S", S: "W", W: "N" },
  180: { N: "S", E: "W", S: "N", W: "E" },
  270: { N: "W", E: "N", S: "E", W: "S" },
};

/**
 * Maps a canonical tile side to the board direction it occupies after the tile
 * is rotated by `rotation` degrees clockwise.
 *
 * @example
 * rotateSide("N", 90)  // => "E"
 * rotateSide("N", 180) // => "S"
 */
export function rotateSide(side: Side, rotation: Rotation): Side {
  return SIDE_ROTATION[rotation][side];
}

// ---------------------------------------------------------------------------
// Half-edge rotation
// ---------------------------------------------------------------------------

/**
 * Clockwise rotation tables for half-edges.
 *
 * A half-edge label encodes (side, clockwise-sub-position). When the tile
 * rotates, the label transforms by rotating each letter:
 *   letter rotation: N→E→S→W→N (each 90° step)
 */
const HALF_EDGE_ROTATION: Record<Rotation, Record<HalfEdge, HalfEdge>> = {
  0: {
    NW: "NW",
    NE: "NE",
    EN: "EN",
    ES: "ES",
    SE: "SE",
    SW: "SW",
    WS: "WS",
    WN: "WN",
  },
  90: {
    // N→E, W→N, E→S, S→W
    NW: "EN",
    NE: "ES",
    EN: "SE",
    ES: "SW",
    SE: "WS",
    SW: "WN",
    WS: "NW",
    WN: "NE",
  },
  180: {
    // N→S, E→W, S→N, W→E
    NW: "SE",
    NE: "SW",
    EN: "WS",
    ES: "WN",
    SE: "NW",
    SW: "NE",
    WS: "EN",
    WN: "ES",
  },
  270: {
    // N→W, E→N, S→E, W→S
    NW: "WS",
    NE: "WN",
    EN: "NW",
    ES: "NE",
    SE: "EN",
    SW: "ES",
    WS: "SE",
    WN: "SW",
  },
};

/**
 * Maps a canonical half-edge to the board half-edge it occupies after the tile
 * is rotated by `rotation` degrees clockwise.
 *
 * @example
 * rotateHalfEdge("NW", 90)  // => "EN"
 * rotateHalfEdge("NE", 180) // => "SW"
 */
export function rotateHalfEdge(halfEdge: HalfEdge, rotation: Rotation): HalfEdge {
  return HALF_EDGE_ROTATION[rotation][halfEdge];
}
