/**
 * Standard meeple colour set — the single source of truth for the six
 * colours covering up to six Carcassonne players (base game).
 *
 * Covers the five colours present in nearly every physical edition (red,
 * blue, green, yellow, black) plus a documented sixth: **gray**, the colour
 * shipped in the official 6-player "Big Box" / expansion sets (the common
 * alternative being pink — see Item 013 design decisions).
 *
 * Every entry carries a `pattern` token, distinct across the set, so colour
 * is never the only way two players are told apart (accessibility NFR).
 */

import type { MeepleColour } from "./types.js";

/** Ordered list of the 6 standard meeple colours. */
export const meepleColours: readonly MeepleColour[] = [
  { id: "red", name: "Red", value: "#d22d2d", pattern: "solid" },
  { id: "blue", name: "Blue", value: "#2455c4", pattern: "stripes" },
  { id: "green", name: "Green", value: "#2f9e44", pattern: "dots" },
  { id: "yellow", name: "Yellow", value: "#e0b400", pattern: "checks" },
  { id: "black", name: "Black", value: "#1a1a1a", pattern: "crosshatch" },
  { id: "gray", name: "Gray", value: "#8a8a8a", pattern: "diagonal" },
];
